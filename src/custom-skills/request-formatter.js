/**
 * RequestFormatter Skill
 *
 * Normalizes API requests to a standard format.
 * Supports REST, GraphQL, and custom formats.
 */

export class RequestFormatter {
  /**
   * Format a request into standard structure.
   *
   * @param {object|string} input - Raw request data
   * @returns {object} Standardized { method, url, headers, body, params }
   */
  format(input) {
    if (!input) {
      throw new Error('Input is required');
    }

    // Parse string input
    if (typeof input === 'string') {
      return this._parseString(input);
    }

    if (typeof input !== 'object') {
      throw new Error('Input must be string or object');
    }

    // Already formatted
    if (this._isStandardFormat(input)) {
      return input;
    }

    // Detect format and convert
    if (input.query && input.variables) {
      return this._parseGraphQL(input);
    }

    if (input.method && input.uri) {
      return this._parseRestLike(input);
    }

    return this._parseObject(input);
  }

  _isStandardFormat(obj) {
    return (
      obj.method &&
      obj.url &&
      typeof obj.headers === 'object' &&
      (obj.body === undefined || typeof obj.body === 'object' || typeof obj.body === 'string') &&
      (obj.params === undefined || typeof obj.params === 'object')
    );
  }

  _parseString(input) {
    // Basic HTTP request format: "GET /path HTTP/1.1"
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

  _parseRestLike(input) {
    return {
      method: input.method || 'GET',
      url: input.uri || input.url || '/',
      headers: input.headers || {},
      body: input.body,
      params: input.params || input.query || {}
    };
  }

  _parseObject(input) {
    return {
      method: input.method || 'GET',
      url: input.url || input.uri || input.path || '/',
      headers: input.headers || {},
      body: input.body || input.data,
      params: input.params || input.query || {}
    };
  }

  _tryParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
}

export default RequestFormatter;
