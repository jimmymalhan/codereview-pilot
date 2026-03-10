/**
 * MetricsAnalyzer Skill
 *
 * Analyzes time-series metrics data.
 * Computes statistics, trends, and anomalies.
 */

export class MetricsAnalyzer {
  /**
   * Analyze time-series metrics.
   *
   * @param {Array<object>} data - Array of {timestamp, value} pairs
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

  _calculateMean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  _calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  _calculateStdDev(values) {
    const mean = this._calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  _calculatePercentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

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

  _detectAnomalies(values) {
    const mean = this._calculateMean(values);
    const stdDev = this._calculateStdDev(values);
    const threshold = 2; // 2 standard deviations

    return values
      .map((val, idx) => ({
        index: idx,
        value: val,
        zscore: (val - mean) / stdDev,
        isAnomaly: Math.abs((val - mean) / stdDev) > threshold
      }))
      .filter(d => d.isAnomaly);
  }

  _generateSummary(values) {
    const mean = this._calculateMean(values);
    const trend = this._calculateTrend(values);

    return `${values.length} data points, mean=${mean.toFixed(2)}, trend=${trend}`;
  }

  /**
   * Compare two metric periods.
   *
   * @param {Array} before - First period data
   * @param {Array} after - Second period data
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
}

export default MetricsAnalyzer;
