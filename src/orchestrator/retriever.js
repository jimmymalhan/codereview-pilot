/**
 * Retriever Agent
 *
 * Gathers evidence for the debug pipeline using MCP context providers
 * when available, falling back to direct file reads when MCP is
 * unavailable. Returns structured evidence arrays that satisfy the
 * agent-wrapper output contract (evidence: []).
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_TIMEOUT_MS = 5000;

export class Retriever {
  /**
   * @param {object} [config]
   * @param {import('../mcp/mcp-client.js').McpClient|null} [config.mcpClient]
   * @param {string} [config.repoRoot]
   * @param {number} [config.timeoutMs]
   */
  constructor(config = {}) {
    this.mcpClient = config.mcpClient || null;
    this.repoRoot = config.repoRoot || process.cwd();
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Gather evidence for a diagnostic task.
   *
   * @param {object} taskInput
   * @param {string} [taskInput.errorMessage] - The error to investigate
   * @param {string[]} [taskInput.files] - Specific files to retrieve
   * @param {string} [taskInput.logFile] - Log file to search
   * @param {string} [taskInput.logLevel] - Filter log level (error, warn)
   * @param {string} [taskInput.logPattern] - Regex pattern for log search
   * @param {string} [taskInput.schemaFile] - Schema file to retrieve
   * @param {string} [taskInput.table] - Table name filter for schema
   * @param {string} [taskInput.metricsFile] - Metrics file to retrieve
   * @param {string} [taskInput.metric] - Specific metric to filter
   * @returns {Promise<{ evidence: Array, sources: string[] }>}
   */
  async gather(taskInput = {}) {
    const evidence = [];
    const sources = [];

    const requests = this._buildRequests(taskInput);

    if (this.mcpClient && requests.length > 0) {
      const mcpResults = await this._fetchViaMcp(requests);
      for (const [name, result] of mcpResults) {
        if (result) {
          evidence.push({
            provider: name,
            type: result.type,
            data: result.data,
            source: result.source,
            timestamp: result.timestamp
          });
          sources.push(`mcp:${name}`);
        }
      }
    }

    // Fallback: read specific files directly if MCP didn't provide them
    if (taskInput.files && taskInput.files.length > 0) {
      const fileResults = await this._readFilesFallback(taskInput.files, sources);
      evidence.push(...fileResults.evidence);
      sources.push(...fileResults.sources);
    }

    return { evidence, sources };
  }

  /**
   * Build MCP request list from task input.
   * @private
   */
  _buildRequests(taskInput) {
    const requests = [];

    if (taskInput.logFile || taskInput.logLevel || taskInput.logPattern) {
      requests.push({
        name: 'logs',
        params: {
          file: taskInput.logFile,
          level: taskInput.logLevel,
          pattern: taskInput.logPattern
        }
      });
    }

    if (taskInput.schemaFile || taskInput.table) {
      requests.push({
        name: 'schema',
        params: {
          file: taskInput.schemaFile,
          table: taskInput.table
        }
      });
    }

    if (taskInput.metricsFile || taskInput.metric) {
      requests.push({
        name: 'metrics',
        params: {
          file: taskInput.metricsFile,
          metric: taskInput.metric
        }
      });
    }

    if (taskInput.errorMessage) {
      requests.push({
        name: 'repo',
        params: { type: 'recent', limit: 10 }
      });
    }

    return requests;
  }

  /**
   * Fetch context via MCP client with timeout protection.
   * @private
   * @param {Array<{ name: string, params?: object }>} requests
   * @returns {Promise<Map<string, any>>}
   */
  async _fetchViaMcp(requests) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MCP fetch timed out')), this.timeoutMs)
      );
      const fetchPromise = this.mcpClient.fetchMultiple(requests);
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch {
      // MCP unavailable or timed out -- return empty results
      return new Map();
    }
  }

  /**
   * Direct file read fallback for when MCP is unavailable or didn't
   * cover the requested files.
   * @private
   */
  async _readFilesFallback(files, alreadyCoveredSources) {
    const evidence = [];
    const sources = [];

    for (const filePath of files) {
      // Skip if MCP already provided this context
      if (alreadyCoveredSources.includes(`file:${filePath}`)) {
        continue;
      }

      try {
        const absPath = resolve(this.repoRoot, filePath);
        const content = await readFile(absPath, 'utf-8');
        evidence.push({
          provider: 'file-fallback',
          type: 'file',
          data: { path: filePath, content, lineCount: content.split('\n').length },
          source: 'Retriever:file-fallback',
          timestamp: new Date().toISOString()
        });
        sources.push(`file:${filePath}`);
      } catch {
        evidence.push({
          provider: 'file-fallback',
          type: 'file',
          data: { path: filePath, content: null, error: 'File not readable' },
          source: 'Retriever:file-fallback',
          timestamp: new Date().toISOString()
        });
        sources.push(`file:${filePath}:error`);
      }
    }

    return { evidence, sources };
  }
}

export default Retriever;
