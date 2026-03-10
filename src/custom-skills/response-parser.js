/**
 * ResponseParser Skill
 *
 * Parses API responses in JSON, XML, CSV, and HTML formats.
 * Extracts and structures response data for analysis.
 *
 * @extends BaseSkill
 */

import { BaseSkill } from './base-skill.js';

export class ResponseParser extends BaseSkill {
  constructor(options = {}) {
    super({
      name: 'ResponseParser',
      description: 'Parses API responses in JSON, XML, CSV, and HTML formats',
      version: '1.0.0',
      ...options
    });
  }

  /**
   * Validate input before execution.
   *
   * @param {*} input - Response data to parse
   * @returns {object} { valid, errors }
   */
  validate(input) {
    const errors = [];
    if (input === null || input === undefined) {
      errors.push({ field: 'input', message: 'Response is required' });
    } else if (typeof input !== 'string' && typeof input !== 'object') {
      errors.push({ field: 'input', message: 'Response must be string or object' });
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Internal execution - delegates to parse().
   *
   * @param {*} input
   * @returns {object}
   */
  _execute(input) {
    if (typeof input === 'object' && input.response !== undefined) {
      return this.parse(input.response, input.options || {});
    }
    return this.parse(input);
  }

  /**
   * Parse an API response.
   *
   * @param {string|object} response - Raw response data
   * @param {object} [options] - Parsing options
   * @returns {object} { status, headers, body, parsed, contentType }
   */
  parse(response, options = {}) {
    if (response === null || response === undefined || (typeof response === 'string' && response === '')) {
      throw new Error('Response is required');
    }

    if (typeof response === 'object' && response.status !== undefined) {
      return this._parseObject(response);
    }

    if (typeof response === 'string') {
      return this._parseString(response, options);
    }

    throw new Error('Response must be string or object');
  }

  /**
   * Parse a structured response object.
   *
   * @param {object} response - { status, headers, body }
   * @returns {object}
   */
  _parseObject(response) {
    const contentType = this._getContentType(response.headers);
    const parsedBody = this._parseBody(response.body, contentType);

    return {
      status: response.status || 200,
      headers: response.headers || {},
      body: response.body,
      parsed: parsedBody,
      contentType
    };
  }

  /**
   * Parse a raw HTTP response string.
   *
   * @param {string} response
   * @param {object} options
   * @returns {object}
   */
  _parseString(response, options = {}) {
    const lines = response.trim().split('\n');
    const statusLine = lines[0];
    const status = parseInt(statusLine.split(' ')[1]) || 200;

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

    const body = bodyStart > 0 ? lines.slice(bodyStart).join('\n') : '';
    const contentType = this._getContentType(headers);
    const parsed = this._parseBody(body, contentType);

    return {
      status,
      headers,
      body,
      parsed,
      contentType
    };
  }

  /**
   * Extract content type from headers (case-insensitive).
   *
   * @param {object} headers
   * @returns {string}
   */
  _getContentType(headers = {}) {
    if (!headers) return 'text/plain';
    const contentType = Object.entries(headers).find(
      ([key]) => key.toLowerCase() === 'content-type'
    );
    return contentType ? contentType[1].split(';')[0].trim() : 'text/plain';
  }

  /**
   * Parse response body according to content type.
   *
   * @param {string|object} body
   * @param {string} contentType
   * @returns {*}
   */
  _parseBody(body, contentType) {
    if (!body) return null;

    if (contentType.includes('application/json')) {
      return this._parseJSON(body);
    }

    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      return this._parseXML(body);
    }

    if (contentType.includes('text/csv') || contentType.includes('application/csv')) {
      return this._parseCSV(body);
    }

    if (contentType.includes('text/html')) {
      return this._parseHTML(body);
    }

    return body;
  }

  /**
   * Parse a JSON string. Returns an error descriptor on failure.
   *
   * @param {string} str
   * @returns {*}
   */
  _parseJSON(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return { error: 'Invalid JSON', reason: e.message };
    }
  }

  /**
   * Parse simplified XML into { root, elements }.
   *
   * @param {string} str
   * @returns {object|null}
   */
  _parseXML(str) {
    try {
      const rootMatch = str.match(/<(\w+)[^>]*>([\s\S]*)<\/\1>/);
      if (!rootMatch) return null;

      const root = rootMatch[1];
      const content = rootMatch[2];

      const elements = {};
      const elementRegex = /<(\w+)[^>]*>([^<]*)<\/\1>/g;
      let match;

      while ((match = elementRegex.exec(content)) !== null) {
        const [, tag, value] = match;
        if (elements[tag]) {
          if (!Array.isArray(elements[tag])) {
            elements[tag] = [elements[tag]];
          }
          elements[tag].push(value);
        } else {
          elements[tag] = value;
        }
      }

      return { root, elements };
    } catch (e) {
      return { error: 'Invalid XML', reason: e.message };
    }
  }

  /**
   * Parse CSV text into an array of row objects.
   *
   * The first row is treated as headers. Returns an array of objects
   * where each key is a header column name.
   *
   * @param {string} str
   * @returns {object}
   */
  _parseCSV(str) {
    try {
      const lines = str.trim().split('\n').filter(l => l.trim().length > 0);
      if (lines.length === 0) {
        return { headers: [], rows: [], rowCount: 0 };
      }

      const headers = this._parseCSVLine(lines[0]);
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this._parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] !== undefined ? values[idx] : '';
        });
        rows.push(row);
      }

      return { headers, rows, rowCount: rows.length };
    } catch (e) {
      return { error: 'Invalid CSV', reason: e.message };
    }
  }

  /**
   * Parse a single CSV line, handling quoted values.
   *
   * @param {string} line
   * @returns {string[]}
   */
  _parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  }

  /**
   * Parse HTML to extract structural information.
   *
   * @param {string} str
   * @returns {object}
   */
  _parseHTML(str) {
    try {
      const titleMatch = str.match(/<title>([^<]*)<\/title>/i);
      const headings = [];
      const headingRegex = /<h[1-6][^>]*>([^<]*)<\/h[1-6]>/gi;
      let match;

      while ((match = headingRegex.exec(str)) !== null) {
        headings.push(match[1]);
      }

      return {
        title: titleMatch ? titleMatch[1] : undefined,
        headings,
        hasForm: /<form[^>]*>/i.test(str),
        hasScript: /<script[^>]*>/i.test(str)
      };
    } catch (e) {
      return { error: 'Invalid HTML', reason: e.message };
    }
  }

  /** @returns {object} */
  getInputSchema() {
    return {
      type: 'string|object',
      description: 'Raw HTTP response string or structured response object with { status, headers, body }'
    };
  }

  /** @returns {object} */
  getOutputSchema() {
    return {
      type: 'object',
      properties: {
        status: 'number',
        headers: 'object',
        body: 'string|object',
        parsed: 'any',
        contentType: 'string'
      }
    };
  }
}

export default ResponseParser;
