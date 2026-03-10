/**
 * Evidence Verification Skill
 *
 * Validates that all diagnostic claims carry proper evidence citations.
 * Checks file:line references exist in the repository, confirms timestamp
 * formats, and produces a structured validation report.
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Pattern that matches file:line citations such as "src/app.js:42"
 */
const FILE_LINE_PATTERN = /^(.+):(\d+)$/;

/**
 * ISO-8601 timestamp pattern (full or date-only)
 */
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

export class EvidenceVerifier {
  /**
   * @param {object} options
   * @param {string} [options.repoRoot] - Absolute path to the repository root.
   *   When provided, file-existence checks resolve relative to this directory.
   */
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || process.cwd();
  }

  /**
   * Run the full verification suite against a list of claims.
   *
   * @param {Array<object>} claims - Each claim must have at minimum:
   *   - `text`      {string}  The claim statement
   *   - `citation`  {string}  A file:line reference (e.g. "src/run.js:12")
   *   - `timestamp` {string}  ISO-8601 formatted timestamp (optional)
   * @returns {object} Validation report
   *   - `valid`       {boolean}  True when every claim passed all checks
   *   - `totalClaims` {number}
   *   - `issues`      {Array<object>}  List of { claimIndex, field, message }
   */
  verify(claims) {
    if (!Array.isArray(claims)) {
      throw new Error('Claims must be an array');
    }

    const issues = [];

    claims.forEach((claim, index) => {
      // 1. Check that claim is an object
      if (!claim || typeof claim !== 'object') {
        issues.push({ claimIndex: index, field: 'claim', message: 'Claim must be a non-null object' });
        return;
      }

      // 2. Validate text exists
      if (!claim.text || typeof claim.text !== 'string' || claim.text.trim().length === 0) {
        issues.push({ claimIndex: index, field: 'text', message: 'Claim text is missing or empty' });
      }

      // 3. Validate citation format (file:line)
      if (!claim.citation || typeof claim.citation !== 'string') {
        issues.push({ claimIndex: index, field: 'citation', message: 'Citation is missing' });
      } else {
        const citationIssues = this._validateCitation(claim.citation, index);
        issues.push(...citationIssues);
      }

      // 4. Validate timestamp format when present
      if (claim.timestamp !== undefined) {
        if (typeof claim.timestamp !== 'string' || !TIMESTAMP_PATTERN.test(claim.timestamp)) {
          issues.push({
            claimIndex: index,
            field: 'timestamp',
            message: `Invalid timestamp format: "${claim.timestamp}". Expected ISO-8601.`
          });
        }
      }
    });

    return {
      valid: issues.length === 0,
      totalClaims: claims.length,
      issues
    };
  }

  /**
   * Validate a single file:line citation.
   * Returns an array of issue objects (empty if valid).
   *
   * @param {string} citation
   * @param {number} claimIndex
   * @returns {Array<object>}
   */
  _validateCitation(citation, claimIndex) {
    const issues = [];
    const match = FILE_LINE_PATTERN.exec(citation);

    if (!match) {
      issues.push({
        claimIndex,
        field: 'citation',
        message: `Citation "${citation}" does not match file:line format`
      });
      return issues;
    }

    const filePath = match[1];
    const lineNumber = parseInt(match[2], 10);

    if (lineNumber < 1) {
      issues.push({
        claimIndex,
        field: 'citation',
        message: `Line number must be >= 1, got ${lineNumber}`
      });
    }

    // Check file existence relative to repo root
    const absolutePath = resolve(this.repoRoot, filePath);
    if (!existsSync(absolutePath)) {
      issues.push({
        claimIndex,
        field: 'citation',
        message: `Referenced file does not exist: ${filePath}`
      });
    }

    return issues;
  }
}

export default EvidenceVerifier;
