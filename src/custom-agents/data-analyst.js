/**
 * DataAnalyst Agent
 *
 * Explores and analyzes data patterns, identifies anomalies,
 * and provides insights backed by evidence.
 */

import { MetricsAnalyzer } from '../custom-skills/metrics-analyzer.js';
import { DataValidator } from '../custom-skills/data-validator.js';

export class DataAnalystAgent {
  constructor(options = {}) {
    this.metricsAnalyzer = new MetricsAnalyzer();
    this.dataValidator = new DataValidator();
  }

  /**
   * Analyze data and provide insights.
   *
   * @param {object} input
   * @param {*} input.data - Data to analyze
   * @param {string} input.analysisType - 'structure|anomalies|correlation|trends'
   * @param {string} [input.context] - Background context
   * @returns {object} Analysis results with insights and evidence
   */
  async analyze(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be a valid object');
    }

    const { data, analysisType, context } = input;

    if (!data) {
      throw new Error('Data is required');
    }

    const analysis = {
      insights: [],
      anomalies: [],
      suggestions: [],
      confidence: 0
    };

    switch (analysisType) {
      case 'structure':
        return this._analyzeStructure(data, analysis, context);
      case 'anomalies':
        return this._analyzeAnomalies(data, analysis, context);
      case 'correlation':
        return this._analyzeCorrelation(data, analysis, context);
      case 'trends':
        return this._analyzeTrends(data, analysis, context);
      default:
        return this._analyzeStructure(data, analysis, context);
    }
  }

  _analyzeStructure(data, analysis, context) {
    if (Array.isArray(data)) {
      analysis.insights.push({
        type: 'structure',
        description: `Array with ${data.length} items`,
        evidence: `length=${data.length}`
      });

      if (data.length > 0 && typeof data[0] === 'object') {
        const keys = Object.keys(data[0]);
        analysis.insights.push({
          type: 'structure',
          description: `Objects contain ${keys.length} fields: ${keys.join(', ')}`,
          evidence: `[0]: ${JSON.stringify(data[0]).substring(0, 100)}`
        });
      }
    } else if (typeof data === 'object') {
      const keys = Object.keys(data);
      analysis.insights.push({
        type: 'structure',
        description: `Object with ${keys.length} fields`,
        evidence: `Keys: ${keys.join(', ')}`
      });
    } else {
      analysis.insights.push({
        type: 'structure',
        description: `Primitive type: ${typeof data}`,
        evidence: `Value: ${data}`
      });
    }

    analysis.confidence = 0.95;
    analysis.suggestions = ['Examine specific fields', 'Look for patterns in data'];

    return analysis;
  }

  _analyzeAnomalies(data, analysis, context) {
    if (!Array.isArray(data)) {
      analysis.confidence = 0;
      return analysis;
    }

    const numericValues = data
      .filter(item => typeof item === 'number')
      .sort((a, b) => a - b);

    if (numericValues.length < 3) {
      analysis.confidence = 0;
      return analysis;
    }

    const median = numericValues[Math.floor(numericValues.length / 2)];
    const q1 = numericValues[Math.floor(numericValues.length / 4)];
    const q3 = numericValues[Math.floor((3 * numericValues.length) / 4)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Find anomalies
    data.forEach((value, index) => {
      if (typeof value === 'number') {
        if (value < lowerBound || value > upperBound) {
          analysis.anomalies.push({
            value,
            index,
            severity: Math.abs(value - median) > 3 * iqr ? 'high' : 'medium',
            reason: value < lowerBound ? 'Below Q1-1.5×IQR' : 'Above Q3+1.5×IQR'
          });
        }
      }
    });

    analysis.insights.push({
      type: 'anomalies',
      description: `Found ${analysis.anomalies.length} anomalies using IQR method`,
      evidence: `Q1=${q1}, Q3=${q3}, IQR=${iqr}`
    });

    analysis.confidence = analysis.anomalies.length > 0 ? 0.85 : 0.9;
    analysis.suggestions = ['Investigate outliers', 'Check for data quality issues'];

    return analysis;
  }

  _analyzeCorrelation(data, analysis, context) {
    if (!Array.isArray(data) || data.length === 0) {
      analysis.confidence = 0;
      return analysis;
    }

    if (typeof data[0] !== 'object') {
      analysis.confidence = 0;
      return analysis;
    }

    const keys = Object.keys(data[0]);
    const numericFields = keys.filter(key =>
      data.every(item => typeof item[key] === 'number' || item[key] === null || item[key] === undefined)
    );

    analysis.insights.push({
      type: 'correlation',
      description: `Identified ${numericFields.length} numeric fields suitable for correlation`,
      evidence: `Fields: ${numericFields.join(', ')}`
    });

    analysis.confidence = 0.8;
    analysis.suggestions = [
      'Compare trends in numeric fields',
      'Look for increasing/decreasing patterns'
    ];

    return analysis;
  }

  _analyzeTrends(data, analysis, context) {
    if (!Array.isArray(data) || data.length < 2) {
      analysis.confidence = 0;
      return analysis;
    }

    const numericValues = data.filter(item => typeof item === 'number');

    if (numericValues.length < 2) {
      analysis.confidence = 0;
      return analysis;
    }

    const firstHalf = numericValues.slice(0, Math.floor(numericValues.length / 2));
    const secondHalf = numericValues.slice(Math.floor(numericValues.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend = 'stable';
    if (secondAvg > firstAvg * 1.1) {
      trend = 'increasing';
    } else if (secondAvg < firstAvg * 0.9) {
      trend = 'decreasing';
    }

    analysis.insights.push({
      type: 'trends',
      description: `Overall trend: ${trend}`,
      evidence: `First half avg=${firstAvg.toFixed(2)}, Second half avg=${secondAvg.toFixed(2)}`
    });

    analysis.confidence = 0.85;
    analysis.suggestions = [
      `Investigate why data is ${trend}`,
      'Check for external factors'
    ];

    return analysis;
  }
}

export default DataAnalystAgent;
