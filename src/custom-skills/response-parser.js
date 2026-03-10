/**
 * ResponseParser Skill
 *
 * Parses API responses in various formats (JSON, XML, HTML).
 * Extracts and structures response data for analysis.
 */

export class ResponseParser {
  /**
   * Parse an API response.
   *
   * @param {string|object} response - Raw response data
   * @param {object} [options] - Parsing options
   * @returns {object} { status, headers, body, parsed, contentType }
   */
  parse(response, options = {}) {
    if (!response) {
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

  _parseString(response, options = {}) {
    // Parse HTTP response format
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

  _getContentType(headers = {}) {
    if (!headers) return 'text/plain';
    const contentType = Object.entries(headers).find(
      ([key]) => key.toLowerCase() === 'content-type'
    );
    return contentType ? contentType[1].split(';')[0].trim() : 'text/plain';
  }

  _parseBody(body, contentType) {
    if (!body) return null;

    if (contentType.includes('application/json')) {
      return this._parseJSON(body);
    }

    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      return this._parseXML(body);
    }

    if (contentType.includes('text/html')) {
      return this._parseHTML(body);
    }

    return body;
  }

  _parseJSON(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return { error: 'Invalid JSON', reason: e.message };
    }
  }

  _parseXML(str) {
    try {
      // Simplified XML parsing (extracts root element and top-level children)
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

  _parseHTML(str) {
    try {
      // Simplified HTML parsing (extracts title and meta info)
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
}

export default ResponseParser;
