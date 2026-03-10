/**
 * RequestFormatter Skill
 *
 * Normalizes API requests from various formats into a standard structure.
 * Supports raw HTTP strings, REST-like objects, GraphQL queries,
 * cURL commands, and generic object inputs.
 *
 * @extends BaseSkill
 */

import { BaseSkill } from './base-skill.js';

export class RequestFormatter extends BaseSkill {
  constructor(options = {}) {
    super({
      name: 'RequestFormatter',
      description: 'Normalizes API requests from 5+ formats into a standard structure',
      version: '1.0.0',
      ...options
    });
  }

  /**
   * Validate input before execution.
   *
   * @param {*} input - String or object request data
   * @returns {object} { valid, errors }
   */
  validate(input) {
    const errors = [];
    if (input === null || input === undefined) {
      errors.push({ field: 'input', message: 'Input is required' });
    } else if (typeof input !== 'string' && typeof input !== 'object') {
      errors.push({ field: 'input', message: 'Input must be a string or object' });
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Internal execution - delegates to format().
   *
   * @param {*} input - Raw request data
   * @returns {object} Standardized request
   */
  _execute(input) {
    return this.format(input);
  }

  /**
   * Format a request into a standard structure.
   *
   * @param {object|string} input - Raw request data
   * @returns {object} Standardized { method, url, headers, body, params }
   */
  format(input) {
    if (!input) {
      throw new Error('Input is required');
    }

    if (typeof input === 'string') {
      if (input.trim().startsWith('curl ')) {
        return this._parseCurl(input);
      }
      return this._parseString(input);
    }

    if (typeof input !== 'object') {
      throw new Error('Input must be string or object');
    }

    if (this._isStandardFormat(input)) {
      return input;
    }

    if (input.query && input.variables) {
      return this._parseGraphQL(input);
    }

    if (input.method && input.uri) {
      return this._parseRestLike(input);
    }

    if (input.formData && typeof input.formData === 'object') {
      return this._parseFormData(input);
    }

    return this._parseObject(input);
  }

  /**
   * Check whether an object already matches the standard format.
   *
   * @param {object} obj
   * @returns {boolean}
   */
  _isStandardFormat(obj) {
    return (
      obj.method &&
      obj.url &&
      typeof obj.headers === 'object' &&
      (obj.body === undefined || typeof obj.body === 'object' || typeof obj.body === 'string') &&
      (obj.params === undefined || typeof obj.params === 'object')
    );
  }

  /**
   * Parse raw HTTP request string.
   *
   * @param {string} input - e.g. "GET /path HTTP/1.1\nHost: example.com"
   * @returns {object}
   */
  _parseString(input) {
    const lines = input.trim().split('\n');
    const [method, path] = lines[0].split(' ');

    const headers = {};
    let bodyStart = -1;

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        bodyStart = i + 1;
        break;
      }
      const [key, value] = lines[i].split(': ');
      if (key) headers[key] = value || '';
    }

    const body = bodyStart > 0 ? lines.slice(bodyStart).join('\n') : undefined;

    return {
      method: method || 'GET',
      url: path || '/',
      headers,
      body: body ? (this._tryParseJSON(body) || body) : undefined,
      params: {}
    };
  }

  /**
   * Parse a simplified cURL command string.
   *
   * @param {string} input - e.g. "curl -X POST https://api.example.com/data -H 'Content-Type: application/json' -d '{\"key\":\"val\"}'"
   * @returns {object}
   */
  _parseCurl(input) {
    // Parse with proper quote handling
    const regex = /('([^']*)'|"([^"]*)"|(\S+))/g;
    const parts = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
      const value = match[2] || match[3] || match[4];
      if (value && value !== 'curl') {
        parts.push(value);
      }
    }

    let method = 'GET';
    let url = '/';
    const headers = {};
    let body = undefined;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '-X' || part === '--request') {
        method = parts[++i] || 'GET';
      } else if (part === '-H' || part === '--header') {
        const header = parts[++i] || '';
        const colonIdx = header.indexOf(':');
        if (colonIdx > 0) {
          headers[header.slice(0, colonIdx).trim()] = header.slice(colonIdx + 1).trim();
        }
      } else if (part === '-d' || part === '--data' || part === '--data-raw') {
        const raw = parts[++i] || '';
        body = this._tryParseJSON(raw) || raw;
      } else if (part.startsWith('http') || part.startsWith('/')) {
        url = part;
      }
    }

    if (body && method === 'GET') {
      method = 'POST';
    }

    return { method, url, headers, body, params: {} };
  }

  /**
   * Parse a GraphQL request object.
   *
   * @param {object} input - { query, variables, endpoint?, headers? }
   * @returns {object}
   */
  _parseGraphQL(input) {
    return {
      method: 'POST',
      url: input.endpoint || '/graphql',
      headers: { 'Content-Type': 'application/json', ...input.headers },
      body: {
        query: input.query,
        variables: input.variables || {}
      },
      params: {}
    };
  }

  /**
   * Parse a REST-like object with 'uri' field.
   *
   * @param {object} input - { method, uri, headers?, body?, params? }
   * @returns {object}
   */
  _parseRestLike(input) {
    return {
      method: input.method || 'GET',
      url: input.uri || input.url || '/',
      headers: input.headers || {},
      body: input.body,
      params: input.params || input.query || {}
    };
  }

  /**
   * Parse a form-data request.
   *
   * @param {object} input - { formData, url?, method?, headers? }
   * @returns {object}
   */
  _parseFormData(input) {
    return {
      method: input.method || 'POST',
      url: input.url || input.uri || '/',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...input.headers
      },
      body: input.formData,
      params: {}
    };
  }

  /**
   * Parse a generic object input.
   *
   * @param {object} input
   * @returns {object}
   */
  _parseObject(input) {
    return {
      method: input.method || 'GET',
      url: input.url || input.uri || input.path || '/',
      headers: input.headers || {},
      body: input.body || input.data,
      params: input.params || input.query || {}
    };
  }

  /**
   * Attempt to parse a string as JSON, returning null on failure.
   *
   * @param {string} str
   * @returns {object|null}
   */
  _tryParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  /** @returns {object} */
  getInputSchema() {
    return {
      type: 'string|object',
      description: 'Raw HTTP string, cURL command, GraphQL query, REST-like object, form data, or generic object'
    };
  }

  /** @returns {object} */
  getOutputSchema() {
    return {
      type: 'object',
      properties: {
        method: 'string',
        url: 'string',
        headers: 'object',
        body: 'any',
        params: 'object'
      }
    };
  }
}

export default RequestFormatter;
