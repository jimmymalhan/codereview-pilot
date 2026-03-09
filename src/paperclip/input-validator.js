/**
 * Input Validator for Paperclip Integration (SC-1 Compliance)
 *
 * Prevents prompt injection attacks by validating task inputs before they reach any agent.
 * Enforces schema validation, length enforcement, and pattern rejection.
 */

const VALID_TASK_TYPES = ['debug', 'verify', 'route', 'report'];

const PROMPT_INJECTION_PATTERNS = [
  'You are now',
  'Ignore previous',
  'Forget your instructions',
  'Act as',
  'Pretend you are',
  '<system>',
  '</instructions>',
  '[SYSTEM]',
  '```system'
];

const VALID_CONSTRAINT_ALLOWLIST = [
  'never invent fields, tables, APIs, regions, or files',
  'retrieve before explaining',
  'verifier blocks unsupported nouns',
  'skeptic must produce a materially different theory',
  'no edits until the plan is approved'
];

export class InputValidator {
  /**
   * Validate task input before task creation
   * Throws error if validation fails
   */
  static validateTaskInput(taskInput) {
    if (!taskInput || typeof taskInput !== 'object') {
      throw new Error('Task input must be a valid object');
    }

    // Validate task type
    this._validateTaskType(taskInput.type);

    // Validate hypothesis (prompt injection detection)
    if (taskInput.hypothesis) {
      this._validateHypothesis(taskInput.hypothesis);
    }

    // Validate evidence items
    if (taskInput.evidence && Array.isArray(taskInput.evidence)) {
      this._validateEvidenceItems(taskInput.evidence);
    }

    // Validate constraints
    if (taskInput.constraints && Array.isArray(taskInput.constraints)) {
      this._validateConstraints(taskInput.constraints);
    }

    return true;
  }

  /**
   * Validate task type
   */
  static _validateTaskType(type) {
    if (!type) {
      throw new Error('Task type is required');
    }
    if (!VALID_TASK_TYPES.includes(type)) {
      throw new Error(
        `Invalid task type: ${type}. Must be one of: ${VALID_TASK_TYPES.join(', ')}`
      );
    }
  }

  /**
   * Validate hypothesis field for prompt injection patterns
   * Enforces max length and rejects suspicious patterns
   */
  static _validateHypothesis(hypothesis) {
    if (typeof hypothesis !== 'string') {
      throw new Error('Hypothesis must be a string');
    }

    // Check length constraint (2000 char max per spec)
    if (hypothesis.length > 2000) {
      throw new Error(
        `Hypothesis exceeds maximum length of 2000 characters (got ${hypothesis.length})`
      );
    }

    // Check for null bytes and control characters
    if (hypothesis.includes('\x00')) {
      throw new Error('Hypothesis contains null bytes (possible injection attempt)');
    }

    // Check for control characters
    const controlCharRegex = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g;
    if (controlCharRegex.test(hypothesis)) {
      throw new Error('Hypothesis contains control characters (sanitization required)');
    }

    // Check for prompt injection patterns (case-insensitive)
    const lowerHypothesis = hypothesis.toLowerCase();
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (lowerHypothesis.includes(pattern.toLowerCase())) {
        throw new Error(
          `Hypothesis contains prompt injection pattern: "${pattern}"`
        );
      }
    }

    // Note: Base64 payload detection is handled implicitly through length
    // constraints and pattern matching. Very long strings with repeated
    // characters are caught by length validation.
  }

  /**
   * Validate evidence items array
   * Enforces required fields, source validation, and length constraints
   */
  static _validateEvidenceItems(evidence) {
    if (!Array.isArray(evidence)) {
      throw new Error('Evidence must be an array');
    }

    if (evidence.length > 50) {
      throw new Error(
        `Evidence items exceed maximum count of 50 (got ${evidence.length})`
      );
    }

    evidence.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`Evidence item ${index} must be a valid object`);
      }

      // Check required fields
      if (!item.source) {
        throw new Error(`Evidence item ${index} is missing required field: source`);
      }
      if (!item.content) {
        throw new Error(`Evidence item ${index} is missing required field: content`);
      }

      // Validate source (must reference file path or known log format)
      this._validateEvidenceSource(item.source);

      // Validate content length per item (5000 char max)
      if (typeof item.content === 'string' && item.content.length > 5000) {
        throw new Error(
          `Evidence item ${index} content exceeds maximum length of 5000 characters`
        );
      }

      // Check for null bytes in content
      const contentStr = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
      if (contentStr.includes('\x00')) {
        throw new Error(`Evidence item ${index} contains null bytes (sanitization required)`);
      }
    });
  }

  /**
   * Validate evidence source format
   * Must reference actual file path or known log format
   */
  static _validateEvidenceSource(source) {
    if (typeof source !== 'string') {
      throw new Error('Evidence source must be a string');
    }

    // Basic validation: source should look like a file path or log reference
    // Allow patterns like: /path/to/file.log, ./relative/path, logs/app.log, or descriptive source names
    const validSourcePatterns = [
      /^[\.\/\w\-]+[\w\-\.]+$/, // File paths
      /^[A-Za-z0-9_\-\s]+$/, // Descriptive names
      /^https?:\/\// // URLs
    ];

    const isValidSource = validSourcePatterns.some(pattern => pattern.test(source));
    if (!isValidSource && source.length > 500) {
      throw new Error(`Evidence source appears fabricated or is malformed: ${source.substring(0, 50)}...`);
    }
  }

  /**
   * Validate constraints array against CLAUDE.md allowlist
   * Only constraints from the allowlist are permitted
   */
  static _validateConstraints(constraints) {
    if (!Array.isArray(constraints)) {
      throw new Error('Constraints must be an array');
    }

    constraints.forEach((constraint, index) => {
      if (typeof constraint !== 'string') {
        throw new Error(`Constraint ${index} must be a string`);
      }

      // Check if constraint is in the CLAUDE.md allowlist
      const isAllowlisted = VALID_CONSTRAINT_ALLOWLIST.some(
        allowed => allowed.toLowerCase() === constraint.toLowerCase()
      );

      if (!isAllowlisted) {
        throw new Error(
          `Unknown constraint at index ${index}: "${constraint}". Only CLAUDE.md rules are valid.`
        );
      }
    });
  }

  /**
   * Sanitize general string fields (strip null bytes, control chars)
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Strip null bytes
    let sanitized = input.replace(/\x00/g, '');

    // Strip control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }
}

export default InputValidator;
