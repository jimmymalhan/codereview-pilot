/**
 * BaseSkill - Abstract base class for all custom skills.
 *
 * Provides a standard interface with execute(), validate(), and describe()
 * methods. All custom skills must extend this class and implement the
 * abstract methods.
 *
 * @abstract
 */
export class BaseSkill {
  /**
   * @param {object} options - Skill configuration options
   * @param {string} options.name - Human-readable skill name
   * @param {string} options.description - Brief description of what the skill does
   * @param {string} options.version - Semantic version string
   */
  constructor(options = {}) {
    if (new.target === BaseSkill) {
      throw new Error('BaseSkill is abstract and cannot be instantiated directly');
    }
    this.name = options.name || this.constructor.name;
    this.description = options.description || '';
    this.version = options.version || '1.0.0';
    this.createdAt = new Date().toISOString();
  }

  /**
   * Execute the skill with validated input.
   *
   * Runs validate() first, then delegates to _execute() which subclasses implement.
   *
   * @param {*} input - Skill-specific input data
   * @param {object} [context] - Optional execution context
   * @returns {object} Result with { success, data, errors, metadata }
   */
  execute(input, context = {}) {
    const startTime = performance.now();

    const validation = this.validate(input);
    if (!validation.valid) {
      return {
        success: false,
        data: null,
        errors: validation.errors,
        metadata: {
          skill: this.name,
          version: this.version,
          executionTimeMs: performance.now() - startTime
        }
      };
    }

    try {
      const data = this._execute(input, context);
      const executionTimeMs = performance.now() - startTime;

      return {
        success: true,
        data,
        errors: [],
        metadata: {
          skill: this.name,
          version: this.version,
          executionTimeMs
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: [{ message: error.message, stack: error.stack }],
        metadata: {
          skill: this.name,
          version: this.version,
          executionTimeMs: performance.now() - startTime
        }
      };
    }
  }

  /**
   * Validate input before execution.
   *
   * Subclasses must override this to provide skill-specific validation.
   *
   * @abstract
   * @param {*} input - Input to validate
   * @returns {object} { valid: boolean, errors: Array<{field: string, message: string}> }
   */
  validate(input) {
    throw new Error(`${this.constructor.name} must implement validate()`);
  }

  /**
   * Internal execution logic. Subclasses must implement this.
   *
   * @abstract
   * @param {*} input - Validated input data
   * @param {object} context - Execution context
   * @returns {*} Skill-specific result data
   */
  _execute(input, context) {
    throw new Error(`${this.constructor.name} must implement _execute()`);
  }

  /**
   * Return a structured description of this skill including its
   * capabilities, input schema, and output schema.
   *
   * @returns {object} Skill descriptor
   */
  describe() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      inputSchema: this.getInputSchema(),
      outputSchema: this.getOutputSchema()
    };
  }

  /**
   * Return the JSON-schema-like input specification.
   * Subclasses should override to provide accurate schemas.
   *
   * @returns {object} Input schema descriptor
   */
  getInputSchema() {
    return { type: 'any', description: 'No schema defined' };
  }

  /**
   * Return the JSON-schema-like output specification.
   * Subclasses should override to provide accurate schemas.
   *
   * @returns {object} Output schema descriptor
   */
  getOutputSchema() {
    return { type: 'object', properties: { success: 'boolean', data: 'any', errors: 'array', metadata: 'object' } };
  }
}

export default BaseSkill;
