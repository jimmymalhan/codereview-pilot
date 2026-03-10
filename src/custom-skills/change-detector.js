/**
 * ChangeDetector Skill
 *
 * Detects differences between two versions of text or structured data.
 * Computes line-level diffs with context, structural field-level changes,
 * and generates human-readable summaries.
 *
 * @extends BaseSkill
 */

import { BaseSkill } from './base-skill.js';

export class ChangeDetector extends BaseSkill {
  constructor(options = {}) {
    super({
      name: 'ChangeDetector',
      description: 'Detects diffs between data versions with change tracking and context',
      version: '1.0.0',
      ...options
    });
  }

  /**
   * Validate input before execution.
   *
   * @param {*} input - { before, after } for text or { beforeObj, afterObj } for structural
   * @returns {object} { valid, errors }
   */
  validate(input) {
    const errors = [];
    if (input === null || input === undefined) {
      errors.push({ field: 'input', message: 'Input is required' });
      return { valid: false, errors };
    }

    if (typeof input !== 'object') {
      errors.push({ field: 'input', message: 'Input must be an object with before/after' });
      return { valid: false, errors };
    }

    if (input.before !== undefined && input.after !== undefined) {
      if (typeof input.before !== 'string' || typeof input.after !== 'string') {
        errors.push({ field: 'before/after', message: 'Both before and after must be strings' });
      }
    } else if (input.beforeObj !== undefined && input.afterObj !== undefined) {
      if (typeof input.beforeObj !== 'object' || typeof input.afterObj !== 'object') {
        errors.push({ field: 'beforeObj/afterObj', message: 'Both beforeObj and afterObj must be objects' });
      }
    } else {
      errors.push({ field: 'input', message: 'Must provide { before, after } or { beforeObj, afterObj }' });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Internal execution.
   *
   * @param {object} input
   * @returns {object}
   */
  _execute(input) {
    if (input.beforeObj !== undefined && input.afterObj !== undefined) {
      return this.detectStructural(input.beforeObj, input.afterObj);
    }
    return this.detect(input.before, input.after);
  }

  /**
   * Detect changes between two text versions.
   *
   * @param {string} before - Original version
   * @param {string} after - Modified version
   * @returns {object} { added, removed, modified, summary }
   */
  detect(before, after) {
    if (typeof before !== 'string' || typeof after !== 'string') {
      throw new Error('Both before and after must be strings');
    }

    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    const changes = {
      added: [],
      removed: [],
      modified: [],
      summary: ''
    };

    const maxLen = Math.max(beforeLines.length, afterLines.length);

    for (let i = 0; i < maxLen; i++) {
      const beforeLine = beforeLines[i];
      const afterLine = afterLines[i];

      if (beforeLine === undefined) {
        changes.added.push({
          lineNumber: i + 1,
          content: afterLine,
          context: this._getContext(afterLines, i, 'after')
        });
      } else if (afterLine === undefined) {
        changes.removed.push({
          lineNumber: i + 1,
          content: beforeLine,
          context: this._getContext(beforeLines, i, 'before')
        });
      } else if (beforeLine !== afterLine) {
        changes.modified.push({
          lineNumber: i + 1,
          before: beforeLine,
          after: afterLine,
          contextBefore: this._getContext(beforeLines, i, 'before'),
          contextAfter: this._getContext(afterLines, i, 'after')
        });
      }
    }

    changes.summary = this._generateSummary(
      changes.added.length,
      changes.removed.length,
      changes.modified.length
    );

    return changes;
  }

  /**
   * Detect field-level changes in structured objects.
   *
   * @param {object} before - Original object
   * @param {object} after - Modified object
   * @returns {object} { added, removed, modified }
   */
  detectStructural(before, after) {
    if (typeof before !== 'object' || typeof after !== 'object') {
      throw new Error('Both before and after must be objects');
    }

    const changes = {
      added: [],
      removed: [],
      modified: []
    };

    const beforeKeys = new Set(Object.keys(before));
    const afterKeys = new Set(Object.keys(after));

    afterKeys.forEach(key => {
      if (!beforeKeys.has(key)) {
        changes.added.push({ field: key, value: after[key] });
      }
    });

    beforeKeys.forEach(key => {
      if (!afterKeys.has(key)) {
        changes.removed.push({ field: key, value: before[key] });
      }
    });

    beforeKeys.forEach(key => {
      if (afterKeys.has(key) && before[key] !== after[key]) {
        changes.modified.push({
          field: key,
          before: before[key],
          after: after[key]
        });
      }
    });

    return changes;
  }

  /**
   * Extract surrounding context lines for a change.
   *
   * @param {string[]} lines
   * @param {number} lineIndex
   * @param {string} position
   * @returns {object}
   */
  _getContext(lines, lineIndex, position) {
    const contextStart = Math.max(0, lineIndex - 2);
    const contextEnd = Math.min(lines.length, lineIndex + 3);

    return {
      before: lines.slice(contextStart, lineIndex).map((line, i) => ({
        lineNumber: contextStart + i + 1,
        content: line
      })),
      target: {
        lineNumber: lineIndex + 1,
        content: lines[lineIndex]
      },
      after: lines.slice(lineIndex + 1, contextEnd).map((line, i) => ({
        lineNumber: lineIndex + i + 2,
        content: line
      }))
    };
  }

  /**
   * Generate a human-readable change summary.
   *
   * @param {number} added
   * @param {number} removed
   * @param {number} modified
   * @returns {string}
   */
  _generateSummary(added, removed, modified) {
    const parts = [];
    if (added > 0) parts.push(`+${added} added`);
    if (removed > 0) parts.push(`-${removed} removed`);
    if (modified > 0) parts.push(`~${modified} modified`);

    return parts.length > 0 ? parts.join(', ') : 'No changes detected';
  }

  /** @returns {object} */
  getInputSchema() {
    return {
      type: 'object',
      description: '{ before: string, after: string } for text diff, or { beforeObj, afterObj } for structural diff'
    };
  }

  /** @returns {object} */
  getOutputSchema() {
    return {
      type: 'object',
      properties: {
        added: 'array', removed: 'array', modified: 'array', summary: 'string'
      }
    };
  }
}

export default ChangeDetector;
