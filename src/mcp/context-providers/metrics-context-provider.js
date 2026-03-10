/**
 * MetricsContextProvider
 *
 * Provides performance metrics data as context for the debug pipeline.
 * Reads metrics from JSON files or a configured data source.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export class MetricsContextProvider {
  /**
   * @param {object} [config]
   * @param {string} [config.metricsDir] - Directory containing metrics files
   * @param {string[]} [config.extensions] - Metrics file extensions (default ['.json'])
   */
  constructor(config = {}) {
    this.metricsDir = config.metricsDir || join(process.cwd(), 'data', 'metrics');
    this.extensions = config.extensions ?? ['.json'];
  }

  /**
   * Fetch metrics context.
   * @param {object} [params]
   * @param {string} [params.file] - Specific metrics file name
   * @param {string} [params.metric] - Filter for a specific metric name
   * @param {string} [params.since] - ISO timestamp to filter metrics after
   * @returns {Promise<import('../mcp-client.js').ContextResult>}
   */
  async fetch(params = {}) {
    let data;
    if (params.file) {
      data = await this._readMetricsFile(params.file, params);
    } else {
      data = await this._listMetrics(params);
    }

    return {
      type: 'metrics',
      data,
      source: 'MetricsContextProvider',
      timestamp: new Date().toISOString()
    };
  }

  /** @private */
  async _readMetricsFile(fileName, params) {
    try {
      const filePath = join(this.metricsDir, fileName);
      const raw = await readFile(filePath, 'utf-8');
      let metrics = JSON.parse(raw);

      if (Array.isArray(metrics)) {
        if (params.metric) {
          metrics = metrics.filter((m) => m.name === params.metric || m.metric === params.metric);
        }
        if (params.since) {
          const sinceDate = new Date(params.since);
          metrics = metrics.filter((m) => new Date(m.timestamp) >= sinceDate);
        }
      }

      return { file: fileName, metrics, count: Array.isArray(metrics) ? metrics.length : 1 };
    } catch (err) {
      return { file: fileName, metrics: [], count: 0, error: err.message || 'File not readable' };
    }
  }

  /** @private */
  async _listMetrics(params) {
    try {
      const entries = await readdir(this.metricsDir, { withFileTypes: true });
      const metricsFiles = entries
        .filter((e) => e.isFile() && this.extensions.includes(extname(e.name)))
        .map((e) => e.name);

      const results = [];
      for (const file of metricsFiles) {
        const result = await this._readMetricsFile(file, params);
        results.push(result);
      }
      return { files: results, totalFiles: metricsFiles.length };
    } catch {
      return { files: [], totalFiles: 0, error: 'Metrics directory not readable' };
    }
  }
}
