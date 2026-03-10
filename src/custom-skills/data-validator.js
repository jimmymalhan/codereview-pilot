/**
 * DataValidator Skill
 *
 * Validates data types, ranges, formats, and structures.
 * Used across the pipeline for input/output validation.
 */

export class DataValidator {
  /**
   * @param {object} options
   * @param {object} [options.schema] - Type definitions and constraints
   */
  constructor(options = {}) {
    this.schema = options.schema || {};
  }

  /**
   * Validate data against rules.
   *
   * @param {*} data - Data to validate
   * @param {Array<object>} rules - Validation rules
   *   - { type: 'string|number|boolean|object|array' }
   *   - { min, max } for ranges
   *   - { pattern: RegExp } for strings
   *   - { required: true } for mandatory fields
   *   - { enum: [values] } for allowed values
   * @returns {object} { valid, errors }
   */
  validate(data, rules) {
    if (!Array.isArray(rules)) {
      throw new Error('Rules must be an array');
    }

    const errors = [];

    rules.forEach((rule, index) => {
      if (!rule || typeof rule !== 'object') {
        errors.push({ ruleIndex: index, message: 'Rule must be an object' });
        return;
      }

      // Type validation
      if (rule.type) {
        const actualType = Array.isArray(data) ? 'array' : typeof data;
        if (actualType !== rule.type) {
          errors.push({
            ruleIndex: index,
            field: 'type',
            message: `Expected type "${rule.type}", got "${actualType}"`
          });
          return;
        }
      }

      // Range validation (min/max)
      if (rule.min !== undefined && typeof data === 'number') {
        if (data < rule.min) {
          errors.push({
            ruleIndex: index,
            field: 'min',
            message: `Value ${data} is below minimum ${rule.min}`
          });
        }
      }

      if (rule.max !== undefined && typeof data === 'number') {
        if (data > rule.max) {
          errors.push({
            ruleIndex: index,
            field: 'max',
            message: `Value ${data} exceeds maximum ${rule.max}`
          });
        }
      }

      // String length validation
      if (rule.minLength !== undefined && typeof data === 'string') {
        if (data.length < rule.minLength) {
          errors.push({
            ruleIndex: index,
            field: 'minLength',
            message: `String length ${data.length} is below minimum ${rule.minLength}`
          });
        }
      }

      if (rule.maxLength !== undefined && typeof data === 'string') {
        if (data.length > rule.maxLength) {
          errors.push({
            ruleIndex: index,
            field: 'maxLength',
            message: `String length ${data.length} exceeds maximum ${rule.maxLength}`
          });
        }
      }

      // Pattern validation
      if (rule.pattern && typeof data === 'string') {
        const pattern = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
        if (!pattern.test(data)) {
          errors.push({
            ruleIndex: index,
            field: 'pattern',
            message: `String "${data}" does not match pattern ${rule.pattern}`
          });
        }
      }

      // Enum validation
      if (rule.enum && Array.isArray(rule.enum)) {
        if (!rule.enum.includes(data)) {
          errors.push({
            ruleIndex: index,
            field: 'enum',
            message: `Value "${data}" is not in allowed values: ${rule.enum.join(', ')}`
          });
        }
      }

      // Required validation
      if (rule.required && (data === null || data === undefined || data === '')) {
        errors.push({
          ruleIndex: index,
          field: 'required',
          message: 'Value is required'
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      errorCount: errors.length
    };
  }

  /**
   * Validate object structure.
   *
   * @param {object} obj - Object to validate
   * @param {object} schema - Schema with {fieldName: rules}
   * @returns {object} { valid, fieldErrors }
   */
  validateObject(obj, schema) {
    if (typeof obj !== 'object' || obj === null) {
      return {
        valid: false,
        fieldErrors: [{ field: '__root', message: 'Input must be a non-null object' }]
      };
    }

    const fieldErrors = [];

    Object.entries(schema).forEach(([field, rules]) => {
      const value = obj[field];
      const result = this.validate(value, rules);

      if (!result.valid) {
        result.errors.forEach(error => {
          fieldErrors.push({
            field,
            ...error
          });
        });
      }
    });

    return {
      valid: fieldErrors.length === 0,
      fieldErrors
    };
  }
}

export default DataValidator;
