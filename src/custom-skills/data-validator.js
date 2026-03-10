/**
 * DataValidator Skill
 *
 * Validates data against type constraints, format patterns, numeric ranges,
 * and structural schemas. Supports primitive types, string patterns, enums,
 * required fields, and nested object validation.
 *
 * @extends BaseSkill
 */

import { BaseSkill } from './base-skill.js';

export class DataValidator extends BaseSkill {
  /**
   * @param {object} [options]
   * @param {object} [options.schema] - Default schema for validateObject calls
   */
  constructor(options = {}) {
    super({
      name: 'DataValidator',
      description: 'Validates data types, formats, constraints, and structural schemas',
      version: '1.0.0',
      ...options
    });
    this.schema = options.schema || {};
  }

  /**
   * Validate input before execution.
   *
   * @param {object} input - Must contain { data, rules } or { object, schema }
   * @returns {object} { valid, errors }
   */
  validate(input) {
    const errors = [];

    if (input === null || input === undefined) {
      errors.push({ field: 'input', message: 'Input is required' });
      return { valid: false, errors };
    }

    // Support legacy direct-call signature: validate(data, rules)
    if (arguments.length === 2) {
      if (!Array.isArray(arguments[1])) {
        throw new Error('Rules must be an array');
      }
      return this._validateData(arguments[0], arguments[1]);
    }

    // Structured input for execute()
    if (typeof input === 'object' && input.rules) {
      if (!Array.isArray(input.rules)) {
        errors.push({ field: 'rules', message: 'Rules must be an array' });
      }
    } else if (typeof input === 'object' && input.schema) {
      if (typeof input.schema !== 'object') {
        errors.push({ field: 'schema', message: 'Schema must be an object' });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute the validator.
   *
   * @param {object} input - { data, rules } for primitive validation or { object, schema } for structural
   * @param {object} [context] - Execution context
   * @returns {object} Validation result
   */
  _execute(input, context) {
    if (input.schema && input.object !== undefined) {
      return this.validateObject(input.object, input.schema);
    }
    return this._validateData(input.data, input.rules);
  }

  /**
   * Validate data against rules.
   *
   * @param {*} data - Data to validate
   * @param {Array<object>} rules - Validation rules
   *   - { type: 'string|number|boolean|object|array' }
   *   - { min, max } for numeric ranges
   *   - { minLength, maxLength } for string length
   *   - { pattern: RegExp|string } for string matching
   *   - { required: true } for mandatory values
   *   - { enum: [values] } for allowed values
   * @returns {object} { valid, errors, errorCount }
   */
  _validateData(data, rules) {
    if (!Array.isArray(rules)) {
      throw new Error('Rules must be an array');
    }

    const errors = [];

    rules.forEach((rule, index) => {
      if (!rule || typeof rule !== 'object') {
        errors.push({ ruleIndex: index, message: 'Rule must be an object' });
        return;
      }

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

      if (rule.enum && Array.isArray(rule.enum)) {
        if (!rule.enum.includes(data)) {
          errors.push({
            ruleIndex: index,
            field: 'enum',
            message: `Value "${data}" is not in allowed values: ${rule.enum.join(', ')}`
          });
        }
      }

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
   * Validate an object against a structural schema.
   *
   * @param {object} obj - Object to validate
   * @param {object} schema - Map of { fieldName: rulesArray }
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
      const result = this._validateData(value, rules);

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

  /** @returns {object} Input schema descriptor */
  getInputSchema() {
    return {
      type: 'object',
      properties: {
        data: { type: 'any', description: 'Data to validate' },
        rules: { type: 'array', description: 'Array of validation rule objects' },
        object: { type: 'object', description: 'Object for structural validation' },
        schema: { type: 'object', description: 'Schema map of { fieldName: rulesArray }' }
      }
    };
  }

  /** @returns {object} Output schema descriptor */
  getOutputSchema() {
    return {
      type: 'object',
      properties: {
        valid: 'boolean',
        errors: 'array',
        errorCount: 'number',
        fieldErrors: 'array'
      }
    };
  }
}

export default DataValidator;
