/**
 * BaseAgent - Abstract base class for all custom agents.
 *
 * Provides a standard interface (run, validate, describe) and lifecycle
 * hooks that every agent must implement. Ensures consistent behavior,
 * input validation, and evidence-backed output across the agent system.
 *
 * @abstract
 */
export class BaseAgent {
  /**
   * @param {object} options
   * @param {string} options.name - Unique agent name
   * @param {string} options.description - What this agent does
   * @param {string} options.version - Semantic version
   * @param {string[]} [options.capabilities] - List of capabilities
   * @param {object} [options.inputSchema] - Expected input shape
   * @param {object} [options.outputSchema] - Expected output shape
   * @param {boolean} [options.readOnly] - Whether agent is read-only
   */
  constructor(options = {}) {
    if (new.target === BaseAgent) {
      throw new Error('BaseAgent is abstract and cannot be instantiated directly');
    }

    if (!options.name || typeof options.name !== 'string') {
      throw new Error('Agent name is required and must be a string');
    }

    if (!options.description || typeof options.description !== 'string') {
      throw new Error('Agent description is required and must be a string');
    }

    /** @type {string} */
    this.name = options.name;

    /** @type {string} */
    this.description = options.description;

    /** @type {string} */
    this.version = options.version || '1.0.0';

    /** @type {string[]} */
    this.capabilities = options.capabilities || [];

    /** @type {object|null} */
    this.inputSchema = options.inputSchema || null;

    /** @type {object|null} */
    this.outputSchema = options.outputSchema || null;

    /** @type {boolean} */
    this.readOnly = options.readOnly || false;

    /** @type {'idle'|'running'|'completed'|'error'} */
    this.state = 'idle';

    /** @type {number} */
    this._startTime = 0;

    /** @type {number} */
    this._lastRunDuration = 0;
  }

  /**
   * Run the agent with validated input.
   * Wraps the subclass _execute method with lifecycle management.
   *
   * @param {object} input - Agent-specific input
   * @returns {Promise<object>} Agent result with evidence
   * @throws {Error} If input is invalid or execution fails
   */
  async run(input) {
    const validation = this.validate(input);
    if (!validation.valid) {
      throw new Error(`Input validation failed: ${validation.errors.join('; ')}`);
    }

    this.state = 'running';
    this._startTime = Date.now();

    try {
      const result = await this._execute(input);
      this._lastRunDuration = Date.now() - this._startTime;
      this.state = 'completed';

      return {
        agent: this.name,
        version: this.version,
        timestamp: new Date().toISOString(),
        duration: this._lastRunDuration,
        result
      };
    } catch (error) {
      this._lastRunDuration = Date.now() - this._startTime;
      this.state = 'error';
      throw new Error(`Agent ${this.name} execution failed: ${error.message}`);
    }
  }

  /**
   * Validate input against the agent's expected schema.
   *
   * @param {*} input - Input to validate
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(input) {
    const errors = [];

    if (input === null || input === undefined) {
      errors.push('Input is required');
      return { valid: false, errors };
    }

    if (typeof input !== 'object' || Array.isArray(input)) {
      errors.push('Input must be a plain object');
      return { valid: false, errors };
    }

    if (this.inputSchema) {
      const schemaErrors = this._validateSchema(input, this.inputSchema);
      errors.push(...schemaErrors);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Describe the agent's capabilities, interface, and metadata.
   *
   * @returns {object} Agent descriptor
   */
  describe() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      capabilities: this.capabilities,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      readOnly: this.readOnly,
      state: this.state,
      lastRunDuration: this._lastRunDuration
    };
  }

  /**
   * Internal execution method. Subclasses MUST override this.
   *
   * @abstract
   * @param {object} input - Validated input
   * @returns {Promise<object>} Execution result
   */
  async _execute(input) {
    throw new Error(`_execute() must be implemented by ${this.name}`);
  }

  /**
   * Validate input against a schema definition.
   *
   * @param {object} input - Input to validate
   * @param {object} schema - Schema with required/optional field definitions
   * @returns {string[]} List of validation errors
   */
  _validateSchema(input, schema) {
    const errors = [];

    if (schema.required) {
      for (const field of schema.required) {
        if (input[field] === undefined || input[field] === null) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }

    if (schema.properties) {
      for (const [field, def] of Object.entries(schema.properties)) {
        const value = input[field];
        if (value === undefined || value === null) continue;

        if (def.type && typeof value !== def.type && !(def.type === 'array' && Array.isArray(value))) {
          errors.push(`Field '${field}' must be of type '${def.type}', got '${typeof value}'`);
        }

        if (def.enum && !def.enum.includes(value)) {
          errors.push(`Field '${field}' must be one of: ${def.enum.join(', ')}`);
        }
      }
    }

    return errors;
  }
}

export default BaseAgent;
