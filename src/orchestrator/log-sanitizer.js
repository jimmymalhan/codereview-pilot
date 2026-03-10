/**
 * Log Sanitizer for Debug Copilot Orchestration (SC-4 Compliance)
 *
 * Strips PII and secrets from logs at write-time.
 * 8 sanitization patterns for API keys, env vars, emails, IPs, tokens.
 */

const SANITIZATION_PATTERNS = [
  {
    name: 'ANTHROPIC_API_KEY',
    regex: /sk-[a-zA-Z0-9]{20,}/g,
    replacement: '[REDACTED:API_KEY]'
  },
  {
    name: 'ENV_KEY_ASSIGNMENT',
    regex: /[A-Z_]+_KEY=[^\s]+/g,
    replacement: '[REDACTED:ENV_VAR]'
  },
  {
    name: 'ENV_SECRET_ASSIGNMENT',
    regex: /[A-Z_]+_SECRET=[^\s]+/g,
    replacement: '[REDACTED:ENV_VAR]'
  },
  {
    name: 'ENV_TOKEN_ASSIGNMENT',
    regex: /[A-Z_]+_TOKEN=[^\s]+/g,
    replacement: '[REDACTED:ENV_VAR]'
  },
  {
    name: 'ENV_PASSWORD_ASSIGNMENT',
    regex: /[A-Z_]+_PASSWORD=[^\s]+/g,
    replacement: '[REDACTED:ENV_VAR]'
  },
  {
    name: 'EMAIL_ADDRESS',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[REDACTED:EMAIL]'
  },
  {
    name: 'IPV4_ADDRESS',
    regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[REDACTED:IP]'
  },
  {
    name: 'BEARER_TOKEN',
    regex: /Bearer [A-Za-z0-9._~+/=-]+/g,
    replacement: 'Bearer [REDACTED:TOKEN]'
  }
];

export class LogSanitizer {
  /**
   * Sanitize a string by removing all PII/secret patterns
   * Applies all 8 patterns in order
   */
  static sanitize(input) {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;
    for (const pattern of SANITIZATION_PATTERNS) {
      sanitized = sanitized.replace(pattern.regex, pattern.replacement);
    }
    return sanitized;
  }

  /**
   * Sanitize an object recursively
   * Traverses all string values and arrays
   */
  static sanitizeObject(obj, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitize(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, depth + 1, maxDepth));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value, depth + 1, maxDepth);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Check if a string contains any sensitive patterns (for detection)
   * Returns array of detected pattern names
   */
  static detectSensitivePatterns(input) {
    if (typeof input !== 'string') {
      return [];
    }

    const detected = [];
    for (const pattern of SANITIZATION_PATTERNS) {
      if (pattern.regex.test(input)) {
        detected.push(pattern.name);
        // Reset regex test position for global flag
        pattern.regex.lastIndex = 0;
      }
    }
    return detected;
  }

  /**
   * Get all sanitization patterns (for auditing/documentation)
   */
  static getPatterns() {
    return SANITIZATION_PATTERNS.map(p => ({
      name: p.name,
      pattern: p.regex.source,
      replacement: p.replacement
    }));
  }

  /**
   * Sanitize log entry before writing to audit trail
   * Wraps the entry and ensures all sensitive fields are redacted
   */
  static sanitizeLogEntry(logEntry) {
    if (!logEntry || typeof logEntry !== 'object') {
      return logEntry;
    }

    const sanitized = { ...logEntry };

    // Sanitize all string fields
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      }
    }

    // Add sanitization flag if any patterns were detected
    const detected = [];
    for (const value of Object.values(logEntry)) {
      if (typeof value === 'string') {
        detected.push(...this.detectSensitivePatterns(value));
      }
    }

    if (detected.length > 0) {
      sanitized._sanitized = {
        timestamp: new Date().toISOString(),
        patternsDetected: [...new Set(detected)]
      };
    }

    return sanitized;
  }
}

export default LogSanitizer;
