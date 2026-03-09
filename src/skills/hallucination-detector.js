/**
 * Hallucination Detection Skill
 *
 * Detects claims about non-existent fields, APIs, or function signatures.
 * Validates data types against a provided schema and computes a
 * hallucination risk score between 0.0 (no risk) and 1.0 (certain hallucination).
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export class HallucinationDetector {
  /**
   * @param {object} options
   * @param {string}        [options.repoRoot]    - Repository root for file lookups.
   * @param {object|null}   [options.schema]      - Schema map of { entityName: { fields: string[], methods: string[] } }.
   * @param {Array<string>} [options.knownAPIs]   - List of known API endpoint patterns.
   */
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || process.cwd();
    this.schema = options.schema || null;
    this.knownAPIs = options.knownAPIs || [];
  }

  /**
   * Analyse a set of claims and return a hallucination report.
   *
   * @param {Array<object>} claims - Each claim may contain:
   *   - `text`           {string}  Claim text
   *   - `referencedField`  {string}  e.g. "user.email"
   *   - `referencedAPI`    {string}  e.g. "POST /api/users"
   *   - `functionSignature` {object} { file, name, params }
   *   - `dataType`        {object}  { field, expectedType }
   * @returns {object} Report
   *   - `riskScore`      {number}  0.0 - 1.0
   *   - `totalClaims`    {number}
   *   - `flaggedClaims`  {number}
   *   - `details`        {Array<object>}  { claimIndex, type, message }
   */
  detect(claims) {
    if (!Array.isArray(claims)) {
      throw new Error('Claims must be an array');
    }

    if (claims.length === 0) {
      return { riskScore: 0.0, totalClaims: 0, flaggedClaims: 0, details: [] };
    }

    const details = [];

    claims.forEach((claim, index) => {
      if (!claim || typeof claim !== 'object') {
        details.push({ claimIndex: index, type: 'invalid', message: 'Claim is not a valid object' });
        return;
      }

      // Check referenced fields against schema
      if (claim.referencedField && this.schema) {
        const fieldIssue = this._checkField(claim.referencedField, index);
        if (fieldIssue) details.push(fieldIssue);
      }

      // Check referenced APIs
      if (claim.referencedAPI) {
        const apiIssue = this._checkAPI(claim.referencedAPI, index);
        if (apiIssue) details.push(apiIssue);
      }

      // Check function signatures against source
      if (claim.functionSignature) {
        const sigIssue = this._checkFunctionSignature(claim.functionSignature, index);
        if (sigIssue) details.push(sigIssue);
      }

      // Check data types against schema
      if (claim.dataType && this.schema) {
        const typeIssue = this._checkDataType(claim.dataType, index);
        if (typeIssue) details.push(typeIssue);
      }
    });

    const flaggedClaims = new Set(details.map(d => d.claimIndex)).size;
    const riskScore = Math.min(1.0, flaggedClaims / claims.length);

    return {
      riskScore: parseFloat(riskScore.toFixed(2)),
      totalClaims: claims.length,
      flaggedClaims,
      details
    };
  }

  /**
   * Check whether a referenced field exists in the schema.
   * Field format: "entity.fieldName" (e.g. "user.email").
   *
   * @param {string} field
   * @param {number} claimIndex
   * @returns {object|null}
   */
  _checkField(field, claimIndex) {
    const parts = field.split('.');
    if (parts.length < 2) {
      return { claimIndex, type: 'unknown_field', message: `Field "${field}" has no entity prefix (expected entity.field)` };
    }

    const [entity, ...fieldParts] = parts;
    const fieldName = fieldParts.join('.');
    const entitySchema = this.schema[entity];

    if (!entitySchema) {
      return { claimIndex, type: 'unknown_entity', message: `Entity "${entity}" not found in schema` };
    }

    const knownFields = entitySchema.fields || [];
    if (!knownFields.includes(fieldName)) {
      return { claimIndex, type: 'unknown_field', message: `Field "${fieldName}" does not exist on entity "${entity}"` };
    }

    return null;
  }

  /**
   * Check whether a referenced API endpoint matches known patterns.
   *
   * @param {string} api - e.g. "POST /api/users"
   * @param {number} claimIndex
   * @returns {object|null}
   */
  _checkAPI(api, claimIndex) {
    if (this.knownAPIs.length === 0) {
      // No API list provided; cannot validate
      return null;
    }

    const matched = this.knownAPIs.some(known => {
      if (known === api) return true;
      // Support simple wildcard matching
      const pattern = known.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(api);
    });

    if (!matched) {
      return { claimIndex, type: 'unknown_api', message: `API "${api}" not found in known API list` };
    }

    return null;
  }

  /**
   * Check whether a function signature matches what exists in source.
   * Reads the referenced file and searches for the function name.
   *
   * @param {object} sig - { file, name, params }
   * @param {number} claimIndex
   * @returns {object|null}
   */
  _checkFunctionSignature(sig, claimIndex) {
    if (!sig.file || !sig.name) {
      return { claimIndex, type: 'invalid_signature', message: 'Function signature missing file or name' };
    }

    const absolutePath = resolve(this.repoRoot, sig.file);
    if (!existsSync(absolutePath)) {
      return { claimIndex, type: 'missing_file', message: `File "${sig.file}" does not exist` };
    }

    let content;
    try {
      content = readFileSync(absolutePath, 'utf-8');
    } catch (err) {
      return { claimIndex, type: 'read_error', message: `Cannot read "${sig.file}": ${err.message}` };
    }

    // Look for function/method name in the file
    const namePattern = new RegExp(`\\b${escapeRegExp(sig.name)}\\b`);
    if (!namePattern.test(content)) {
      return {
        claimIndex,
        type: 'missing_function',
        message: `Function "${sig.name}" not found in "${sig.file}"`
      };
    }

    // If params are specified, do a basic arity check
    if (Array.isArray(sig.params)) {
      const paramPattern = new RegExp(
        `${escapeRegExp(sig.name)}\\s*\\(([^)]*)\\)`
      );
      const paramMatch = paramPattern.exec(content);
      if (paramMatch) {
        const foundParams = paramMatch[1]
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0);
        if (foundParams.length !== sig.params.length) {
          return {
            claimIndex,
            type: 'param_mismatch',
            message: `Function "${sig.name}" expects ${foundParams.length} params, claim says ${sig.params.length}`
          };
        }
      }
    }

    return null;
  }

  /**
   * Check a data type claim against the schema.
   *
   * @param {object} dataType - { field, expectedType }
   * @param {number} claimIndex
   * @returns {object|null}
   */
  _checkDataType(dataType, claimIndex) {
    if (!dataType.field || !dataType.expectedType) {
      return { claimIndex, type: 'invalid_type_claim', message: 'Data type claim missing field or expectedType' };
    }

    const parts = dataType.field.split('.');
    if (parts.length < 2) return null;

    const [entity, ...fieldParts] = parts;
    const fieldName = fieldParts.join('.');
    const entitySchema = this.schema[entity];

    if (!entitySchema || !entitySchema.types) return null;

    const actualType = entitySchema.types[fieldName];
    if (actualType && actualType !== dataType.expectedType) {
      return {
        claimIndex,
        type: 'type_mismatch',
        message: `Field "${dataType.field}" is "${actualType}" in schema, claim says "${dataType.expectedType}"`
      };
    }

    return null;
  }
}

/**
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default HallucinationDetector;
