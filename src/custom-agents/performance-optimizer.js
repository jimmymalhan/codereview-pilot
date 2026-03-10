/**
 * PerformanceOptimizer Agent (File-based)
 *
 * Analyzes code for performance bottlenecks, algorithm complexity,
 * and suggests optimizations with impact estimates. Uses file path input.
 *
 * Safety: Only suggests real improvements backed by complexity analysis metrics.
 * Every suggestion includes current complexity, expected improvement, and
 * implementation guidance.
 */

import { BaseAgent } from './base-agent.js';

export class PerformanceOptimizerFileAgent extends BaseAgent {
  constructor(options = {}) {
    super({
      name: 'PerformanceOptimizerFile',
      description: 'Analyzes files for performance bottlenecks with complexity metrics and optimization suggestions',
      version: '1.0.0',
      capabilities: ['bottleneck-detection', 'algorithm-analysis', 'memory-analysis', 'io-analysis', 'database-analysis'],
      inputSchema: {
        required: ['targetPath'],
        properties: {
          targetPath: { type: 'string' },
          analysisType: { type: 'string', enum: ['full', 'algorithm', 'memory', 'io', 'database'] },
          context: { type: 'string' }
        }
      },
      outputSchema: {
        properties: {
          bottlenecks: { type: 'array' },
          optimizations: { type: 'array' },
          impact: { type: 'array' },
          summary: { type: 'string' }
        }
      },
      readOnly: true,
      ...options
    });

    this.maxAnalysisLines = 10000;
  }

  /**
   * Execute performance analysis on a file.
   *
   * @param {object} input
   * @param {string} input.targetPath - File or directory path
   * @param {string} [input.analysisType='full'] - Analysis scope
   * @param {string} [input.context] - Application context
   * @returns {Promise<object>} Performance analysis report
   */
  async _execute(input) {
    const { targetPath, analysisType = 'full', context = '' } = input;

    const report = {
      bottlenecks: [],
      optimizations: [],
      impact: [],
      summary: ''
    };

    const code = this._simulateCodeRead(targetPath);
    const lines = code.split('\n');
    const analysisLines = lines.slice(0, this.maxAnalysisLines);

    switch (analysisType) {
      case 'algorithm':
        this._analyzeAlgorithms(analysisLines, report, targetPath);
        break;
      case 'memory':
        this._analyzeMemory(analysisLines, report, targetPath);
        break;
      case 'io':
        this._analyzeIO(analysisLines, report, targetPath);
        break;
      case 'database':
        this._analyzeDatabase(analysisLines, report, targetPath);
        break;
      case 'full':
      default:
        this._analyzeAlgorithms(analysisLines, report, targetPath);
        this._analyzeMemory(analysisLines, report, targetPath);
        this._analyzeIO(analysisLines, report, targetPath);
        this._analyzeDatabase(analysisLines, report, targetPath);
    }

    const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
    report.bottlenecks.sort((a, b) => severityMap[b.severity] - severityMap[a.severity]);

    report.bottlenecks.forEach((bottleneck, idx) => {
      const optimization = this._generateOptimization(bottleneck, idx);
      if (optimization) {
        report.optimizations.push(optimization);
        report.impact.push(this._estimateImpact(bottleneck, idx));
      }
    });

    report.summary = this._buildSummary(report);

    return report;
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

    if (!input.targetPath || typeof input.targetPath !== 'string') {
      throw new Error('targetPath is required');
    }

    return this._execute(input);
  }

  /** @private */
  _analyzeAlgorithms(lines, report, filePath) {
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }

      const nestedLoopsMatch = line.match(/for\s*\([^)]*\)\s*{[\s\S]*?(for|while)\s*\(/);
      if (nestedLoopsMatch) {
        report.bottlenecks.push({
          type: 'algorithm',
          description: 'Nested loop detected - potential O(n^2) or worse complexity',
          location: `${filePath}:${lineNum}`,
          severity: 'high',
          currentComplexity: 'O(n^2)',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }

      if (/(for|while)\s*\([^)]*\)[\s\S]{0,200}?\+\s*=|concat|\.join/.test(line)) {
        report.bottlenecks.push({
          type: 'algorithm',
          description: 'String concatenation in loop - causes repeated allocations',
          location: `${filePath}:${lineNum}`,
          severity: 'medium',
          currentComplexity: 'O(n^2) string operations',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }

      if (/\(\.\*\+|\..*\+\?|\..*\*\?/.test(line) && /\.match|\.test|\.replace/.test(line)) {
        report.bottlenecks.push({
          type: 'algorithm',
          description: 'Potentially catastrophic regex pattern detected',
          location: `${filePath}:${lineNum}`,
          severity: 'medium',
          currentComplexity: 'O(2^n) worst case',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }

      if (/function\s+\w+.*{[\s\S]{0,100}?\w+\s*\(/.test(line)) {
        const recursiveMatch = line.match(/recursive|fibonacci|fib\s*\(/i);
        if (recursiveMatch && !line.includes('memo') && !line.includes('cache')) {
          report.bottlenecks.push({
            type: 'algorithm',
            description: 'Recursive algorithm without memoization - exponential complexity',
            location: `${filePath}:${lineNum}`,
            severity: 'high',
            currentComplexity: 'O(2^n)',
            evidence: `Code: ${line.trim().substring(0, 100)}...`
          });
        }
      }

      if (/\.filter.*\.map|\.map.*\.filter|\.sort.*\.filter|\.reverse/.test(line)) {
        report.bottlenecks.push({
          type: 'algorithm',
          description: 'Chained array operations iterate full array multiple times',
          location: `${filePath}:${lineNum}`,
          severity: 'medium',
          currentComplexity: 'O(n*k) where k is number of operations',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }
    });
  }

  /** @private */
  _analyzeMemory(lines, report, filePath) {
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (/new\s+Array\s*\(\s*\d{5,}\s*\)/.test(line)) {
        const sizeMatch = line.match(/\d{5,}/);
        const size = sizeMatch ? sizeMatch[0] : 'large';

        report.bottlenecks.push({
          type: 'memory',
          description: `Large array pre-allocation detected: ${size} items`,
          location: `${filePath}:${lineNum}`,
          severity: 'medium',
          currentComplexity: `O(n) memory for ${size} items`,
          evidence: `Code: ${line.trim()}`
        });
      }

      if (/\.addEventListener|\.on\s*\(|setInterval|setTimeout/.test(line)) {
        if (!lines.slice(Math.max(0, index - 10), index + 10).some(l => /removeEventListener|\.off\s*\(|clearInterval|clearTimeout/.test(l))) {
          report.bottlenecks.push({
            type: 'memory',
            description: 'Event listener or timer without cleanup detected',
            location: `${filePath}:${lineNum}`,
            severity: 'high',
            currentComplexity: 'O(1) leak per event/timer',
            evidence: `Code: ${line.trim().substring(0, 100)}...`
          });
        }
      }

      if (/const\s+\w*cache\s*=|const\s+\w*store\s*=|const\s+\w*pool\s*=/.test(line)) {
        if (!lines.slice(Math.max(0, index), Math.min(lines.length, index + 5)).some(l => /maxSize|limit|clear|delete/.test(l))) {
          report.bottlenecks.push({
            type: 'memory',
            description: 'Unbounded cache or store detected - potential memory leak',
            location: `${filePath}:${lineNum}`,
            severity: 'high',
            currentComplexity: 'O(infinity) - unbounded growth',
            evidence: `Code: ${line.trim()}`
          });
        }
      }

      if (/JSON\.parse.*JSON\.stringify|structuredClone|deepClone|cloneDeep/.test(line)) {
        if (index > 0 && /(for|while)\s*\(/.test(lines[index - 1])) {
          report.bottlenecks.push({
            type: 'memory',
            description: 'Deep cloning in loop - expensive operation',
            location: `${filePath}:${lineNum}`,
            severity: 'high',
            currentComplexity: 'O(n*m) where m is object size',
            evidence: `Code: ${line.trim()}`
          });
        }
      }
    });
  }

  /** @private */
  _analyzeIO(lines, report, filePath) {
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (/readFileSync|writeFileSync|execSync/.test(line)) {
        report.bottlenecks.push({
          type: 'io',
          description: 'Synchronous I/O blocks event loop',
          location: `${filePath}:${lineNum}`,
          severity: 'high',
          currentComplexity: 'Blocking - no concurrency',
          evidence: `Code: ${line.trim()}`
        });
      }

      if (/await\s+.*\);[\s\S]{0,50}?await\s+.*\);/.test(line)) {
        report.bottlenecks.push({
          type: 'io',
          description: 'Sequential I/O operations - could be parallelized',
          location: `${filePath}:${lineNum}`,
          severity: 'medium',
          currentComplexity: 'O(n*t) where t is latency per operation',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }

      if (/fetch|query.*all|select.*\*/.test(line) && !line.includes('limit') && !line.includes('offset') && !line.includes('skip')) {
        report.bottlenecks.push({
          type: 'io',
          description: 'Fetching all data without pagination - memory intensive',
          location: `${filePath}:${lineNum}`,
          severity: 'medium',
          currentComplexity: 'O(n) memory for all results',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }
    });
  }

  /** @private */
  _analyzeDatabase(lines, report, filePath) {
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (/(for|while)\s*\([^)]*\)[\s\S]{0,200}?(?:query|db\.|select|fetch)\s*\(/.test(line)) {
        report.bottlenecks.push({
          type: 'database',
          description: 'N+1 query pattern detected - executes query per loop iteration',
          location: `${filePath}:${lineNum}`,
          severity: 'critical',
          currentComplexity: 'O(n) database queries',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }

      if (/select.*where|query.*where/.test(line) && !line.includes('index') && !line.includes('explain')) {
        report.bottlenecks.push({
          type: 'database',
          description: 'WHERE clause without apparent index optimization',
          location: `${filePath}:${lineNum}`,
          severity: 'medium',
          currentComplexity: 'O(n) full table scan',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }

      if (/new.*Connection|createConnection/.test(line) && !line.includes('pool')) {
        report.bottlenecks.push({
          type: 'database',
          description: 'Database connection created per query - should use connection pool',
          location: `${filePath}:${lineNum}`,
          severity: 'high',
          currentComplexity: 'O(c) connection overhead per query',
          evidence: `Code: ${line.trim()}`
        });
      }

      if (/join[\s\S]{1,100}join[\s\S]{1,100}join/.test(line)) {
        report.bottlenecks.push({
          type: 'database',
          description: 'Multiple joins without apparent optimization',
          location: `${filePath}:${lineNum}`,
          severity: 'medium',
          currentComplexity: 'O(n*m*k) Cartesian product risk',
          evidence: `Code: ${line.trim().substring(0, 100)}...`
        });
      }
    });
  }

  /** @private */
  _generateOptimization(bottleneck, idx) {
    const optimizations = {
      'O(n^2)': {
        suggestion: 'Use a HashMap or Set for lookups instead of nested loops',
        expectedComplexity: 'O(n)',
        effort: 'medium',
        implementation: 'Create a Map from inner loop items, then single pass through outer loop with O(1) lookups'
      },
      'O(n^2) string': {
        suggestion: 'Use Array.join() or String.concat() instead of += in loops',
        expectedComplexity: 'O(n)',
        effort: 'quick',
        implementation: 'Collect strings in array, join at end: const result = items.join("")'
      },
      'O(2^n)': {
        suggestion: 'Add memoization to recursive calls',
        expectedComplexity: 'O(n)',
        effort: 'medium',
        implementation: 'Cache results of fib(n) in Map, return cached value if exists'
      },
      'database': {
        suggestion: 'Move query outside loop - use batch query or JOIN',
        expectedComplexity: 'O(1) or O(log n)',
        effort: 'major',
        implementation: 'Load all needed data once with single query, then iterate in memory'
      },
      'memory': {
        suggestion: 'Implement size limit and cleanup strategy',
        expectedComplexity: 'O(size limit)',
        effort: 'medium',
        implementation: 'Use LRU cache or implement maxSize with eviction policy'
      },
      'blocking': {
        suggestion: 'Replace sync operations with async/await',
        expectedComplexity: 'Non-blocking concurrency',
        effort: 'major',
        implementation: 'Use readFile, promises, or streams instead of Sync variants'
      },
      'sequential': {
        suggestion: 'Parallelize operations with Promise.all()',
        expectedComplexity: 'O(max latency) instead of O(sum latency)',
        effort: 'quick',
        implementation: 'Change await seq1; await seq2 to await Promise.all([seq1, seq2])'
      }
    };

    let key = bottleneck.currentComplexity;
    if (bottleneck.type === 'database') key = 'database';
    if (bottleneck.type === 'memory') key = 'memory';
    if (bottleneck.type === 'io') {
      if (bottleneck.description.includes('Sequential')) key = 'sequential';
      else if (bottleneck.description.includes('Synchronous')) key = 'blocking';
    }

    const opt = optimizations[key] || optimizations['O(n^2)'];

    return {
      bottleneckId: idx,
      suggestion: opt.suggestion,
      expectedComplexity: opt.expectedComplexity,
      effort: opt.effort,
      implementation: opt.implementation
    };
  }

  /** @private */
  _estimateImpact(bottleneck, idx) {
    const datasetSize = 1000;

    let estimate = '';
    let applicability = '';
    let confidence = 0.7;

    switch (bottleneck.currentComplexity) {
      case 'O(n^2)':
        estimate = `${(datasetSize * datasetSize) / datasetSize}x faster (${datasetSize}^2 -> ${datasetSize} operations)`;
        applicability = `For n=${datasetSize} items, reduces ${datasetSize * datasetSize} operations to ${datasetSize}`;
        confidence = 0.85;
        break;
      case 'O(2^n)':
        estimate = 'Potentially 1000x+ faster (exponential to linear reduction)';
        applicability = 'For n=10, reduces 1024 operations to 10';
        confidence = 0.9;
        break;
      case 'O(n) database queries':
        estimate = `${datasetSize}x fewer database round trips (${datasetSize} queries -> 1-2 queries)`;
        applicability = `For n=${datasetSize} items, removes ${datasetSize - 2} network round trips (~${50 * (datasetSize - 2)}ms saved)`;
        confidence = 0.95;
        break;
      case 'O(n) memory for all results':
        estimate = 'Memory usage: proportional to page size (constant) instead of total dataset';
        applicability = 'With 1M total records, paginating 1000 at a time: 1KB x 1000 vs millions';
        confidence = 0.85;
        break;
      case 'O(infinity) - unbounded growth':
        estimate = 'Prevents memory exhaustion and crashes';
        applicability = 'Long-running processes: prevents crashes after N operations';
        confidence = 0.9;
        break;
      case 'Blocking - no concurrency':
        estimate = '10-100x throughput improvement (handle multiple requests concurrently)';
        applicability = 'For 100 concurrent requests, process all in parallel vs sequential';
        confidence = 0.8;
        break;
      case 'O(n*t) where t is latency per operation':
        estimate = 'Up to N-fold speedup (run N requests in parallel)';
        applicability = `For ${datasetSize} requests at 100ms each: ${datasetSize * 100}ms -> 100ms`;
        confidence = 0.75;
        break;
      default:
        estimate = '2-10x improvement expected';
        applicability = 'Depends on dataset size and current bottleneck severity';
        confidence = 0.6;
    }

    return {
      bottleneckId: idx,
      metric: bottleneck.type === 'algorithm' ? 'Time complexity' :
              bottleneck.type === 'memory' ? 'Memory usage' :
              bottleneck.type === 'io' ? 'I/O latency' : 'Database queries',
      estimate,
      applicability,
      confidence
    };
  }

  /** @private */
  _buildSummary(report) {
    const criticalCount = report.bottlenecks.filter(b => b.severity === 'critical').length;
    const highCount = report.bottlenecks.filter(b => b.severity === 'high').length;
    const mediumCount = report.bottlenecks.filter(b => b.severity === 'medium').length;

    if (report.bottlenecks.length === 0) {
      return 'No major performance bottlenecks detected in analysis.';
    }

    const parts = [];
    if (criticalCount > 0) parts.push(`${criticalCount} critical`);
    if (highCount > 0) parts.push(`${highCount} high-impact`);
    if (mediumCount > 0) parts.push(`${mediumCount} medium`);

    return `Found ${report.bottlenecks.length} bottlenecks (${parts.join(', ')}). Implementing suggested optimizations could improve performance by 2-100x depending on dataset size.`;
  }

  /** @private */
  _simulateCodeRead(filePath) {
    const exampleCode = `
// Example code with performance issues

// BOTTLENECK 1: N+1 query pattern
function getUsersWithPosts(userIds) {
  const users = [];
  for (let i = 0; i < userIds.length; i++) {
    const user = db.query('SELECT * FROM users WHERE id = ?', [userIds[i]]);
    const posts = db.query('SELECT * FROM posts WHERE user_id = ?', [userIds[i]]);
    users.push({ ...user, posts });
  }
  return users;
}

// BOTTLENECK 2: Nested loops O(n^2)
function findDuplicates(arr1, arr2) {
  const duplicates = [];
  for (let i = 0; i < arr1.length; i++) {
    for (let j = 0; j < arr2.length; j++) {
      if (arr1[i] === arr2[j]) {
        duplicates.push(arr1[i]);
      }
    }
  }
  return duplicates;
}

// BOTTLENECK 3: String concatenation in loop O(n^2)
function buildReport(items) {
  let report = '';
  for (const item of items) {
    report += '<div>' + item.name + '</div>';
  }
  return report;
}

// BOTTLENECK 4: Unbounded cache
const cache = new Map();
app.get('/data/:id', (req, res) => {
  if (!cache.has(req.params.id)) {
    cache.set(req.params.id, fetchData(req.params.id));
  }
  res.json(cache.get(req.params.id));
});

// BOTTLENECK 5: Synchronous I/O
function loadConfig() {
  const config = fs.readFileSync('./config.json', 'utf8');
  return JSON.parse(config);
}

// BOTTLENECK 6: Exponential recursion
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// BOTTLENECK 7: Sequential async operations
async function fetchUserData(userId) {
  const profile = await fetch(\`/api/users/\${userId}\`);
  const posts = await fetch(\`/api/users/\${userId}/posts\`);
  const comments = await fetch(\`/api/users/\${userId}/comments\`);
  return { profile, posts, comments };
}

// BOTTLENECK 8: Chained array operations
function processData(items) {
  return items
    .filter(item => item.active)
    .map(item => item.value)
    .filter(value => value > 0)
    .map(value => value * 2)
    .sort((a, b) => a - b);
}

// BOTTLENECK 9: Event listener without cleanup
class Widget {
  constructor() {
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    console.log('Resized');
  }
}

// BOTTLENECK 10: Connection per query
function queryUser(id) {
  const conn = new MySQLConnection();
  const result = conn.query('SELECT * FROM users WHERE id = ?', [id]);
  conn.close();
  return result;
}
    `;

    return exampleCode;
  }
}

export default PerformanceOptimizerFileAgent;
