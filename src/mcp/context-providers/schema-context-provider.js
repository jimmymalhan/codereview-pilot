/**
 * SchemaContextProvider
 *
 * Provides database schema definitions as context for the debug pipeline.
 * Reads schema files from a configurable directory.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export class SchemaContextProvider {
  /**
   * @param {object} [config]
   * @param {string} [config.schemaDir] - Directory containing schema files
   * @param {string[]} [config.extensions] - Schema file extensions (default ['.sql', '.json', '.prisma'])
   */
  constructor(config = {}) {
    this.schemaDir = config.schemaDir || join(process.cwd(), 'data');
    this.extensions = config.extensions ?? ['.sql', '.json', '.prisma'];
  }

  /**
   * Fetch schema context.
   * @param {object} [params]
   * @param {string} [params.file] - Specific schema file name
   * @param {string} [params.table] - Filter for a specific table name
   * @returns {Promise<import('../mcp-client.js').ContextResult>}
   */
  async fetch(params = {}) {
    let data;
    if (params.file) {
      data = await this._readSchemaFile(params.file, params);
    } else {
      data = await this._listSchemas(params);
    }

    return {
      type: 'schema',
      data,
      source: 'SchemaContextProvider',
      timestamp: new Date().toISOString()
    };
  }

  /** @private */
  async _readSchemaFile(fileName, params) {
    try {
      const filePath = join(this.schemaDir, fileName);
      const content = await readFile(filePath, 'utf-8');

      let filtered = content;
      if (params.table) {
        const lines = content.split('\n');
        const tableLines = this._extractTable(lines, params.table);
        filtered = tableLines.join('\n');
      }

      return { file: fileName, content: filtered };
    } catch {
      return { file: fileName, content: '', error: 'File not readable' };
    }
  }

  /** @private */
  async _listSchemas(params) {
    try {
      const entries = await readdir(this.schemaDir, { withFileTypes: true });
      const schemaFiles = entries
        .filter((e) => e.isFile() && this.extensions.includes(extname(e.name)))
        .map((e) => e.name);

      const results = [];
      for (const file of schemaFiles) {
        const result = await this._readSchemaFile(file, params);
        results.push(result);
      }
      return { schemas: results, totalFiles: schemaFiles.length };
    } catch {
      return { schemas: [], totalFiles: 0, error: 'Schema directory not readable' };
    }
  }

  /**
   * Extract lines related to a specific table definition.
   * @private
   */
  _extractTable(lines, tableName) {
    const result = [];
    let capturing = false;
    const tablePattern = new RegExp(`\\b${tableName}\\b`, 'i');

    for (const line of lines) {
      if (!capturing && tablePattern.test(line)) {
        capturing = true;
      }
      if (capturing) {
        result.push(line);
        // End capture at closing paren/brace or empty line after content
        if (/^[)};]/.test(line.trim()) && result.length > 1) {
          break;
        }
      }
    }
    return result;
  }
}
