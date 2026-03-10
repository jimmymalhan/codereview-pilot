/**
 * DataAnalyst Agent
 *
 * Read-only agent that explores and analyzes data patterns, identifies
 * anomalies, and provides insights backed by statistical evidence.
 *
 * Safety: This agent is strictly read-only. It never modifies input data.
 * All analysis methods return new objects without mutating the source.
 */

import { BaseAgent } from './base-agent.js';

export class DataAnalystAgent extends BaseAgent {
  constructor(options = {}) {
    super({
      name: 'DataAnalyst',
      description: 'Analyzes data patterns, detects anomalies, and identifies trends with statistical evidence',
      version: '1.0.0',
      capabilities: ['file-analysis', 'metric-analysis', 'log-analysis', 'schema-analysis', 'anomaly-detection', 'trend-analysis', 'correlation-analysis'],
      inputSchema: {
        required: ['data'],
        properties: {
          data: { type: 'object' },
          analysisType: { type: 'string', enum: ['structure', 'anomalies', 'correlation', 'trends'] },
          context: { type: 'string' }
        }
      },
      outputSchema: {
        properties: {
          insights: { type: 'array' },
          anomalies: { type: 'array' },
          suggestions: { type: 'array' },
          confidence: { type: 'number' }
        }
      },
      readOnly: true,
      ...options
    });
  }

  /**
   * Validate input with agent-specific rules.
   *
   * @param {*} input - Input to validate
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(input) {
    const errors = [];

    if (input === null || input === undefined) {
      return { valid: false, errors: ['Input is required'] };
    }

    if (typeof input !== 'object' || Array.isArray(input)) {
      return { valid: false, errors: ['Input must be a plain object'] };
    }

    if (input.data === undefined || input.data === null) {
      errors.push("Required field 'data' is missing");
    }

    if (input.analysisType !== undefined && typeof input.analysisType !== 'string') {
      errors.push("Field 'analysisType' must be of type 'string'");
    }

    if (input.analysisType !== undefined && !['structure', 'anomalies', 'correlation', 'trends'].includes(input.analysisType)) {
      errors.push("Field 'analysisType' must be one of: structure, anomalies, correlation, trends");
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute data analysis. This is the core read-only analysis engine.
   *
   * @param {object} input
   * @param {*} input.data - Data to analyze
   * @param {string} [input.analysisType='structure'] - Analysis type
   * @param {string} [input.context] - Background context
   * @returns {Promise<object>} Analysis results with insights and evidence
   */
  async _execute(input) {
    const { data, analysisType = 'structure', context } = input;

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

  /**
   * Backward-compatible analyze method.
   *
   * @param {object} input
   * @returns {Promise<object>}
   */
  async analyze(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Input must be a valid object');
    }

    if (!input.data) {
      throw new Error('Data is required');
    }

    return this._execute(input);
  }

  /**
   * Analyze the structure of data.
   *
   * @param {*} data - Data to analyze
   * @param {object} analysis - Accumulator for results
   * @param {string} [context] - Optional context
   * @returns {object} Structure analysis
   * @private
   */
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

  /**
   * Detect anomalies using the IQR method.
   *
   * @param {*} data - Data to analyze
   * @param {object} analysis - Accumulator
   * @param {string} [context] - Optional context
   * @returns {object} Anomaly analysis
   * @private
   */
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

    data.forEach((value, index) => {
      if (typeof value === 'number') {
        if (value < lowerBound || value > upperBound) {
          analysis.anomalies.push({
            value,
            index,
            severity: Math.abs(value - median) > 3 * iqr ? 'high' : 'medium',
            reason: value < lowerBound ? 'Below Q1-1.5xIQR' : 'Above Q3+1.5xIQR'
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

  /**
   * Analyze correlation between numeric fields.
   *
   * @param {*} data - Data to analyze
   * @param {object} analysis - Accumulator
   * @param {string} [context] - Optional context
   * @returns {object} Correlation analysis
   * @private
   */
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

  /**
   * Analyze data trends over time.
   *
   * @param {*} data - Data to analyze
   * @param {object} analysis - Accumulator
   * @param {string} [context] - Optional context
   * @returns {object} Trend analysis
   * @private
   */
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
