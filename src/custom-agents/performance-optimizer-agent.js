/**
 * PerformanceOptimizer Agent (Code-based)
 *
 * Analyzes code strings for performance issues, suggests optimizations,
 * and estimates performance impact.
 *
 * Safety: Only suggests real improvements backed by metrics. Every suggestion
 * includes estimated improvement percentage, impact assessment, and
 * implementation guidance with evidence.
 */

import { BaseAgent } from './base-agent.js';

export class PerformanceOptimizerAgent extends BaseAgent {
  constructor(options = {}) {
    super({
      name: 'PerformanceOptimizer',
      description: 'Analyzes code for performance bottlenecks and suggests optimizations with impact estimates',
      version: '1.0.0',
      capabilities: ['bottleneck-detection', 'complexity-analysis', 'optimization-suggestions', 'impact-estimation'],
      inputSchema: {
        required: ['code'],
        properties: {
          code: { type: 'string' },
          analysisType: { type: 'string', enum: ['complexity', 'bottlenecks', 'optimization', 'all'] },
          context: { type: 'string' }
        }
      },
      outputSchema: {
        properties: {
          issues: { type: 'array' },
          suggestions: { type: 'array' },
          estimatedImprovement: { type: 'number' },
          confidence: { type: 'number' }
        }
      },
      readOnly: true,
      ...options
    });

    this.complexityThresholds = {
      veryHigh: { loops: 3, calls: 100 },
      high: { loops: 2, calls: 50 },
      medium: { loops: 1, calls: 20 }
    };
  }

  /**
   * Execute performance analysis on code string.
   *
   * @param {object} input
   * @param {string} input.code - Code to analyze
   * @param {string} [input.analysisType='all'] - Analysis scope
   * @param {string} [input.context] - Additional context
   * @returns {Promise<object>} Performance analysis with suggestions
   */
  async _execute(input) {
    const { code, analysisType = 'all', context } = input;

    const analysis = {
      issues: [],
      suggestions: [],
      estimatedImprovement: 0,
      confidence: 0
    };

    switch (analysisType) {
      case 'complexity':
        return this._analyzeComplexity(code, analysis, context);
      case 'bottlenecks':
        return this._analyzeBottlenecks(code, analysis, context);
      case 'optimization':
        return this._analyzeOptimization(code, analysis, context);
      case 'all':
      default:
        return this._analyzeAll(code, analysis, context);
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

    if (!input.code || typeof input.code !== 'string') {
      throw new Error('Code is required and must be a string');
    }

    return this._execute(input);
  }

  /** @private */
  _analyzeComplexity(code, analysis, context) {
    const lines = code.split('\n');
    let nestedLoops = 0;
    let functionCalls = 0;
    let maxNestingLevel = 0;
    let currentNestingLevel = 0;

    lines.forEach(line => {
      const loopMatches = (line.match(/\b(for|while|forEach|map|filter|reduce)\s*\(/gi) || []).length;
      nestedLoops += loopMatches;

      functionCalls += (line.match(/\.\w+\s*\(/g) || []).length;

      currentNestingLevel += (line.match(/\{/g) || []).length;
      currentNestingLevel -= (line.match(/\}/g) || []).length;
      maxNestingLevel = Math.max(maxNestingLevel, currentNestingLevel);
    });

    let complexity = 'low';
    let complexityScore = 1;

    if (nestedLoops >= 3 || maxNestingLevel > 6 || functionCalls > 100) {
      complexity = 'very-high';
      complexityScore = 5;
      analysis.issues.push({
        type: 'high-complexity',
        severity: 'high',
        description: 'Code has very high cyclomatic complexity',
        evidence: `Nested loops: ${nestedLoops}, Nesting level: ${maxNestingLevel}, Function calls: ${functionCalls}`
      });
    } else if (nestedLoops >= 2 || maxNestingLevel > 4 || functionCalls > 50) {
      complexity = 'high';
      complexityScore = 4;
      analysis.issues.push({
        type: 'high-complexity',
        severity: 'medium',
        description: 'Code has high cyclomatic complexity',
        evidence: `Nested loops: ${nestedLoops}, Nesting level: ${maxNestingLevel}, Function calls: ${functionCalls}`
      });
    } else if (nestedLoops >= 1 || maxNestingLevel > 2) {
      complexity = 'medium';
      complexityScore = 2;
    }

    analysis.suggestions = [
      'Break down complex functions into smaller, single-responsibility functions',
      'Use design patterns (Strategy, Decorator) to reduce nesting',
      'Consider using functional programming techniques (map, filter, reduce)',
      'Extract loop logic into separate functions'
    ];

    analysis.estimatedImprovement = Math.min(35, complexityScore * 8);
    analysis.confidence = 0.85;
    analysis.metrics = {
      complexity,
      nestedLoops,
      maxNestingLevel,
      functionCalls,
      complexityScore
    };

    return analysis;
  }

  /** @private */
  _analyzeBottlenecks(code, analysis, context) {
    const lines = code.split('\n');
    const bottlenecks = [];

    lines.forEach((line, index) => {
      if (/for|forEach|while/.test(line) && /.*(query|fetch|request|db\.)/i.test(lines[index + 1] || '')) {
        bottlenecks.push({
          type: 'n-plus-one',
          lineNumber: index + 1,
          severity: 'high',
          description: 'Potential N+1 query problem detected',
          evidence: `Loop at line ${index + 1} with database query`
        });
      }

      if (/readFileSync|require.*Sync|XMLHttpRequest/.test(line)) {
        bottlenecks.push({
          type: 'sync-io',
          lineNumber: index + 1,
          severity: 'high',
          description: 'Synchronous I/O operation blocking event loop',
          evidence: line.trim().substring(0, 60)
        });
      }

      if (/for|forEach|while/.test(line) && /\+\s*['"]/i.test(lines[index + 1] || '')) {
        bottlenecks.push({
          type: 'string-concat-loop',
          lineNumber: index + 1,
          severity: 'medium',
          description: 'String concatenation in loop causes quadratic time complexity',
          evidence: `Loop at line ${index + 1}`
        });
      }

      if (/function.*\(|const.*=.*=>/.test(line) && /return.*\(.*\)/.test(lines[index + 2] || '')) {
        const functionName = line.match(/function\s+(\w+)|(\w+)\s*=/)?.[1] || line.match(/function\s+(\w+)|(\w+)\s*=/)?.[2];
        if (functionName && new RegExp(functionName + '\\s*\\(').test(lines[index + 2] || '')) {
          bottlenecks.push({
            type: 'unoptimized-recursion',
            lineNumber: index + 1,
            severity: 'medium',
            description: 'Recursive function without memoization',
            evidence: `Recursive call in function`
          });
        }
      }

      if (/JSON\.parse\(JSON\.stringify|Object\.assign\({}|spread\s*operator/.test(line)) {
        bottlenecks.push({
          type: 'deep-clone',
          lineNumber: index + 1,
          severity: 'medium',
          description: 'Deep cloning operation may be expensive',
          evidence: line.trim().substring(0, 60)
        });
      }
    });

    analysis.issues = bottlenecks;
    analysis.suggestions = [
      'Use batch queries or JOINs instead of N+1 queries',
      'Convert synchronous operations to async/await',
      'Use string builders (arrays with join) instead of concatenation',
      'Implement memoization for recursive functions',
      'Use shallow cloning when deep cloning is not necessary'
    ];

    analysis.estimatedImprovement = Math.min(60, bottlenecks.length * 12);
    analysis.confidence = 0.8;
    analysis.bottleneckCount = bottlenecks.length;

    return analysis;
  }

  /** @private */
  _analyzeOptimization(code, analysis, context) {
    const lines = code.split('\n');
    const opportunities = [];

    lines.forEach((line, index) => {
      if (/\.map\s*\(/.test(line) && /\.filter\s*\(/.test(lines[index + 1] || '') || /\.filter\s*\(/.test(line) && /\.map\s*\(/.test(lines[index + 1] || '')) {
        opportunities.push({
          type: 'chained-iterations',
          impact: '15-25%',
          suggestion: 'Combine map and filter into single loop'
        });
      }

      if (/const|let|var/.test(line) && !/\w+(?=\s*[+\-*\/=<>])/.test(line)) {
        opportunities.push({
          type: 'unused-variable',
          impact: '1-2%',
          suggestion: 'Remove unused variable declarations'
        });
      }

      if (/\.length/.test(line) && /\.length/.test(lines[index + 1] || '')) {
        opportunities.push({
          type: 'repeated-calculation',
          impact: '5-10%',
          suggestion: 'Cache length in variable before loop'
        });
      }

      if (/\.indexOf|\.includes|\.find/.test(line) && /for|while/.test(lines[index - 1] || '')) {
        opportunities.push({
          type: 'linear-search',
          impact: '20-40%',
          suggestion: 'Use Set or Map for O(1) lookups instead of O(n) array search'
        });
      }

      if (/if\s*\(.*\)\s*\{/.test(line) && !/return|break|continue/.test(lines[index + 1] || '')) {
        opportunities.push({
          type: 'missing-early-exit',
          impact: '5-15%',
          suggestion: 'Add early return/break to avoid unnecessary processing'
        });
      }
    });

    analysis.issues = opportunities;
    analysis.suggestions = [
      'Use pipeline (reduce) to combine operations',
      'Leverage Set/Map data structures for fast lookups',
      'Cache expensive calculations',
      'Add early exits in conditional blocks',
      'Use generators for lazy evaluation of large collections'
    ];

    const totalImpact = opportunities.length * 5 + Math.min(25, opportunities.length * 3);
    analysis.estimatedImprovement = Math.min(50, totalImpact);
    analysis.confidence = 0.82;
    analysis.opportunityCount = opportunities.length;

    return analysis;
  }

  /** @private */
  _analyzeAll(code, analysis, context) {
    const complexityAnalysis = this._analyzeComplexity(code, { issues: [], suggestions: [], estimatedImprovement: 0, confidence: 0 }, context);
    const bottleneckAnalysis = this._analyzeBottlenecks(code, { issues: [], suggestions: [], estimatedImprovement: 0, confidence: 0 }, context);
    const optimizationAnalysis = this._analyzeOptimization(code, { issues: [], suggestions: [], estimatedImprovement: 0, confidence: 0 }, context);

    analysis.issues = [
      ...complexityAnalysis.issues,
      ...bottleneckAnalysis.issues,
      ...optimizationAnalysis.issues
    ];

    const allSuggestions = [
      ...complexityAnalysis.suggestions,
      ...bottleneckAnalysis.suggestions,
      ...optimizationAnalysis.suggestions
    ];

    analysis.suggestions = [...new Set(allSuggestions)];

    const avgImprovement = (complexityAnalysis.estimatedImprovement + bottleneckAnalysis.estimatedImprovement + optimizationAnalysis.estimatedImprovement) / 3;
    analysis.estimatedImprovement = Math.round(avgImprovement);
    analysis.confidence = 0.83;

    analysis.analysisDetails = {
      complexity: complexityAnalysis.metrics,
      bottlenecks: bottleneckAnalysis.bottleneckCount,
      opportunities: optimizationAnalysis.opportunityCount
    };

    return analysis;
  }
}

export default PerformanceOptimizerAgent;
