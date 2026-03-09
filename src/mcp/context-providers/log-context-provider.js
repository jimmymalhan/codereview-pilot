/**
 * LogContextProvider
 *
 * Parses and provides log file contents as structured context
 * for the debug pipeline.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export class LogContextProvider {
  /**
   * @param {object} [config]
   * @param {string} [config.logsDir] - Directory containing log files
   * @param {number} [config.maxLines] - Max lines to return per file (default 200)
   * @param {string[]} [config.extensions] - Log file extensions (default ['.log', '.txt'])
   */
  constructor(config = {}) {
    this.logsDir = config.logsDir || join(process.cwd(), 'logs');
    this.maxLines = config.maxLines ?? 200;
    this.extensions = config.extensions ?? ['.log', '.txt'];
  }

  /**
   * Fetch log context.
   * @param {object} [params]
   * @param {string} [params.file] - Specific log file name
   * @param {string} [params.level] - Filter by level (error, warn, info)
   * @param {string} [params.pattern] - Regex pattern to filter lines
   * @returns {Promise<import('../mcp-client.js').ContextResult>}
   */
  async fetch(params = {}) {
    let data;
    if (params.file) {
      data = await this._readLogFile(params.file, params);
    } else {
      data = await this._listAndReadLogs(params);
    }

    return {
      type: 'logs',
      data,
      source: 'LogContextProvider',
      timestamp: new Date().toISOString()
    };
  }

  /** @private */
  async _readLogFile(fileName, params) {
    try {
      const filePath = join(this.logsDir, fileName);
      const content = await readFile(filePath, 'utf-8');
      let lines = content.split('\n').slice(0, this.maxLines);

      if (params.level) {
        const level = params.level.toUpperCase();
        lines = lines.filter((l) => l.toUpperCase().includes(level));
      }
      if (params.pattern) {
        const re = new RegExp(params.pattern, 'i');
        lines = lines.filter((l) => re.test(l));
      }

      return { file: fileName, lines, lineCount: lines.length };
    } catch {
      return { file: fileName, lines: [], error: 'File not readable' };
    }
  }

  /** @private */
  async _listAndReadLogs(params) {
    try {
      const entries = await readdir(this.logsDir, { withFileTypes: true });
      const logFiles = entries
        .filter((e) => e.isFile() && this.extensions.includes(extname(e.name)))
        .map((e) => e.name);

      const results = [];
      for (const file of logFiles) {
        const result = await this._readLogFile(file, params);
        results.push(result);
      }
      return { files: results, totalFiles: logFiles.length };
    } catch {
      return { files: [], totalFiles: 0, error: 'Logs directory not readable' };
    }
  }
}
