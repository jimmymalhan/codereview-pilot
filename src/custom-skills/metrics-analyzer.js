/**
 * MetricsAnalyzer Skill
 *
 * Analyzes time-series metrics data. Computes descriptive statistics,
 * percentiles, linear trends, and detects anomalies using z-score analysis.
 *
 * @extends BaseSkill
 */

import { BaseSkill } from './base-skill.js';

export class MetricsAnalyzer extends BaseSkill {
  constructor(options = {}) {
    super({
      name: 'MetricsAnalyzer',
      description: 'Analyzes time-series metrics with trends, anomalies, and percentiles',
      version: '1.0.0',
      ...options
    });
  }

  /**
   * Validate input before execution.
   *
   * @param {*} input - Array of { timestamp, value } or { data, compareTo? }
   * @returns {object} { valid, errors }
   */
  validate(input) {
    const errors = [];

    if (input === null || input === undefined) {
      errors.push({ field: 'input', message: 'Input is required' });
      return { valid: false, errors };
    }

    const data = Array.isArray(input) ? input : input.data;

    if (!Array.isArray(data)) {
      errors.push({ field: 'data', message: 'Data must be an array' });
    } else if (data.length === 0) {
      errors.push({ field: 'data', message: 'Data must be a non-empty array' });
    } else if (data.length < 3) {
      errors.push({ field: 'data', message: 'Minimum 3 data points required for analysis' });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Internal execution.
   *
   * @param {*} input
   * @returns {object}
   */
  _execute(input) {
    if (Array.isArray(input)) {
      return this.analyze(input);
    }
    if (input.compareTo) {
      return this.compare(input.data, input.compareTo);
    }
    return this.analyze(input.data);
  }

  /**
   * Analyze time-series metrics.
   *
   * @param {Array<object>} data - Array of { timestamp, value } pairs
   * @returns {object} Statistics and analysis
   */
  analyze(data) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array');
    }

    if (data.length < 3) {
      throw new Error('Minimum 3 data points required for analysis');
    }

    const values = data.map(d => d.value).filter(v => typeof v === 'number');

    if (values.length === 0) {
      throw new Error('No numeric values found in data');
    }

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: this._calculateMean(values),
      median: this._calculateMedian(values),
      stdDev: this._calculateStdDev(values),
      p50: this._calculatePercentile(values, 0.50),
      p95: this._calculatePercentile(values, 0.95),
      p99: this._calculatePercentile(values, 0.99),
      trend: this._calculateTrend(values),
      anomalies: this._detectAnomalies(values),
      summary: this._generateSummary(values)
    };
  }

  /**
   * Calculate arithmetic mean.
   *
   * @param {number[]} values
   * @returns {number}
   */
  _calculateMean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate median value.
   *
   * @param {number[]} values
   * @returns {number}
   */
  _calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate population standard deviation.
   *
   * @param {number[]} values
   * @returns {number}
   */
  _calculateStdDev(values) {
    const mean = this._calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate the given percentile using the ceiling method.
   *
   * @param {number[]} values
   * @param {number} p - Percentile (0-1)
   * @returns {number}
   */
  _calculatePercentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Determine trend direction via simple linear regression slope.
   *
   * @param {number[]} values
   * @returns {string} 'increasing' | 'decreasing' | 'stable' | 'insufficient_data'
   */
  _calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = this._calculateMean(values);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;

    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Detect anomalies using z-score (> 2 standard deviations from mean).
   *
   * @param {number[]} values
   * @returns {Array<object>}
   */
  _detectAnomalies(values) {
    const mean = this._calculateMean(values);
    const stdDev = this._calculateStdDev(values);
    const threshold = 2;

    return values
      .map((val, idx) => ({
        index: idx,
        value: val,
        zscore: (val - mean) / stdDev,
        isAnomaly: Math.abs((val - mean) / stdDev) > threshold
      }))
      .filter(d => d.isAnomaly);
  }

  /**
   * Generate a human-readable summary string.
   *
   * @param {number[]} values
   * @returns {string}
   */
  _generateSummary(values) {
    const mean = this._calculateMean(values);
    const trend = this._calculateTrend(values);

    return `${values.length} data points, mean=${mean.toFixed(2)}, trend=${trend}`;
  }

  /**
   * Compare two metric periods.
   *
   * @param {Array<object>} before - First period data
   * @param {Array<object>} after - Second period data
   * @returns {object} Comparison results
   */
  compare(before, after) {
    const beforeStats = this.analyze(before);
    const afterStats = this.analyze(after);

    const meanChange = ((afterStats.mean - beforeStats.mean) / beforeStats.mean) * 100;
    const maxChange = ((afterStats.max - beforeStats.max) / beforeStats.max) * 100;

    return {
      before: beforeStats,
      after: afterStats,
      meanChange: meanChange.toFixed(2) + '%',
      maxChange: maxChange.toFixed(2) + '%',
      improved: meanChange < 0,
      degraded: meanChange > 0
    };
  }

  /** @returns {object} */
  getInputSchema() {
    return {
      type: 'array|object',
      description: 'Array of { timestamp, value } pairs, or { data, compareTo? }'
    };
  }

  /** @returns {object} */
  getOutputSchema() {
    return {
      type: 'object',
      properties: {
        count: 'number', min: 'number', max: 'number', mean: 'number',
        median: 'number', stdDev: 'number', p50: 'number', p95: 'number',
        p99: 'number', trend: 'string', anomalies: 'array', summary: 'string'
      }
    };
  }
}

export default MetricsAnalyzer;
