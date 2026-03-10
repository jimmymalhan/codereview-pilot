/**
 * ChangeDetector Skill
 *
 * Detects differences between two versions of data.
 * Highlights added, removed, and modified content.
 */

export class ChangeDetector {
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

    // Simple line-by-line diff
    const maxLen = Math.max(beforeLines.length, afterLines.length);

    for (let i = 0; i < maxLen; i++) {
      const beforeLine = beforeLines[i];
      const afterLine = afterLines[i];

      if (beforeLine === undefined) {
        // Line added
        changes.added.push({
          lineNumber: i + 1,
          content: afterLine,
          context: this._getContext(afterLines, i, 'after')
        });
      } else if (afterLine === undefined) {
        // Line removed
        changes.removed.push({
          lineNumber: i + 1,
          content: beforeLine,
          context: this._getContext(beforeLines, i, 'before')
        });
      } else if (beforeLine !== afterLine) {
        // Line modified
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
   * Detect changes in JSON/YAML structures.
   *
   * @param {object} before - Original object
   * @param {object} after - Modified object
   * @returns {object} Field-level changes
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

    // Find added fields
    afterKeys.forEach(key => {
      if (!beforeKeys.has(key)) {
        changes.added.push({
          field: key,
          value: after[key]
        });
      }
    });

    // Find removed fields
    beforeKeys.forEach(key => {
      if (!afterKeys.has(key)) {
        changes.removed.push({
          field: key,
          value: before[key]
        });
      }
    });

    // Find modified fields
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

  _generateSummary(added, removed, modified) {
    const parts = [];
    if (added > 0) parts.push(`+${added} added`);
    if (removed > 0) parts.push(`-${removed} removed`);
    if (modified > 0) parts.push(`~${modified} modified`);

    return parts.length > 0 ? parts.join(', ') : 'No changes detected';
  }
}

export default ChangeDetector;
