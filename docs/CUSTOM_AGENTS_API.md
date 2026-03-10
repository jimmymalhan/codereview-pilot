# Custom Agents API

**Table of Contents**
1. [Overview](#overview)
2. [Agent Architecture](#agent-architecture)
3. [Agent Definition Format](#agent-definition-format)
4. [Creating Custom Agents](#creating-custom-agents)
5. [Reference: 4 Example Agents](#reference-4-example-agents)
6. [Using Skills in Agents](#using-skills-in-agents)
7. [Async/Await Patterns](#asyncawait-patterns)
8. [Testing Agents](#testing-agents)

---

## Overview

Agents are decision-making entities that use skills to diagnose problems. Unlike skills (which perform data operations), agents coordinate multiple skills, evaluate evidence, and produce diagnostic conclusions.

### Agent vs Skill Recap

| Aspect | Skill | Agent |
|--------|-------|-------|
| **Purpose** | Data transformation | Problem diagnosis |
| **Input** | Structured data | Problem description |
| **Output** | Processed data | Diagnosis with root cause |
| **Dependencies** | Standalone | Uses 2-5 skills |
| **Example** | "Analyze these metrics for anomalies" | "Diagnose why error rate spiked" |

### Agent Types in Claude Debug Copilot

**Core 5-Agent Pipeline** (always present):
1. **Router** - Classifies failure type
2. **Retriever** - Gathers evidence
3. **Skeptic** - Challenges diagnosis
4. **Verifier** - Validates claims
5. **Critic** - Quality gates output

**Custom Agents** (extensible):
- DataAnalyst - Analyzes data patterns
- SecurityAuditor - Checks security issues
- PerformanceOptimizer - Finds bottlenecks
- ComplianceChecker - Verifies compliance

---

## Agent Architecture

### Agent Lifecycle

```
1. INPUT
   ↓
2. VALIDATE (check input format)
   ↓
3. INITIALIZE (load skills, context)
   ↓
4. PROCESS (coordinate skills, evaluate)
   ↓
5. OUTPUT (return structured diagnosis)
```

### Skill Usage Pattern

```javascript
class MyAgent {
  constructor() {
    // Initialize all skills
    this.skillA = new SkillA();
    this.skillB = new SkillB();
  }

  async diagnose(input) {
    // 1. Validate input
    const validation = this.validate(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors[0]}`);
    }

    // 2. Use skills to gather data
    const dataA = await this.skillA.execute(input);
    const dataB = await this.skillB.execute(input);

    // 3. Evaluate results
    const diagnosis = this.evaluate(dataA, dataB);

    // 4. Return structured diagnosis
    return {
      root_cause: diagnosis.cause,
      evidence: diagnosis.citations,
      confidence: diagnosis.confidence,
      fix_plan: diagnosis.plan
    };
  }
}
```

---

## Agent Definition Format

### Agent Markdown Definition

Agents can be defined using a `.md` file format for documentation and configuration:

```markdown
# MyAgent

## Purpose
What problems does this agent solve?

## Responsibilities
- List specific responsibilities
- Each responsibility maps to skills or logic

## Input Contract
```json
{
  "data": "...",
  "context": "..."
}
```
```

## Output Contract
```json
{
  "diagnosis": "...",
  "confidence": 0.85
}
```
```

## Skills Used
- SkillA: What it does
- SkillB: What it does

## Implementation
[Details about how it works]

## Examples
[Usage examples]
```

### Example: DataAnalyst Agent Definition

```markdown
# DataAnalyst Agent

## Purpose
Analyzes data patterns, identifies anomalies, and provides insights backed by evidence.

## Responsibilities
- Detect structural anomalies in datasets
- Identify statistical outliers (using IQR method)
- Detect trends (increasing/decreasing patterns)
- Find correlations between numeric fields

## Input Contract
{
  "data": any[],              // Data to analyze
  "analysisType": string,     // 'structure|anomalies|correlation|trends'
  "context": string?          // Optional background context
}

## Output Contract
{
  "insights": object[],       // List of insights found
  "anomalies": object[],      // Detected outliers
  "confidence": number,       // 0-1 confidence score
  "suggestions": string[]     // Recommended next steps
}

## Skills Used
- MetricsAnalyzer: Detect anomalies and trends
- DataValidator: Verify data types and ranges

## Implementation
1. Validate input data is an array or object
2. Based on analysisType, use appropriate analysis method
3. For anomalies: calculate IQR, identify outliers
4. For trends: compare first/second halves
5. Return insights with confidence score

## Examples
See DataAnalystAgent in src/custom-agents/data-analyst.js
```

---

## Creating Custom Agents

### Step 1: Define Purpose and Responsibilities

```javascript
/**
 * MyAgent
 *
 * Solves: [What problem does this agent diagnose?]
 *
 * Responsibilities:
 * - [What specific diagnoses or analyses does it perform?]
 * - [What evidence does it gather?]
 * - [What conclusions does it draw?]
 */
export class MyAgent {
  // Implementation
}
```

### Step 2: Implement Base Class

```javascript
export class MyAgent {
  /**
   * Create a new agent.
   *
   * @param {object} options
   */
  constructor(options = {}) {
    // Initialize skills
    this.skill1 = new Skill1();
    this.skill2 = new Skill2();

    // Store configuration
    this.config = options;
  }

  /**
   * Diagnose a problem.
   *
   * @param {object} input
   * @returns {Promise<object>}
   */
  async diagnose(input) {
    // Validation → Processing → Output
  }

  /**
   * Validate input structure.
   *
   * @param {object} input
   * @returns {object} { valid: boolean, errors: string[] }
   */
  validate(input) {
    // Check input contract
  }

  /**
   * Get agent metadata.
   *
   * @static
   * @returns {object}
   */
  static metadata() {
    return {
      name: 'MyAgent',
      version: '1.0.0',
      description: 'What this agent does',
      inputs: { /* schema */ },
      outputs: { /* schema */ }
    };
  }
}
```

### Step 3: Implement Validation

```javascript
validate(input) {
  const errors = [];

  if (!input || typeof input !== 'object') {
    errors.push('Input must be an object');
  }

  if (!input.data) {
    errors.push('Input.data is required');
  }

  if (input.type && !['A', 'B', 'C'].includes(input.type)) {
    errors.push(`Input.type must be one of: A, B, C`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Step 4: Implement Diagnosis Logic

```javascript
async diagnose(input) {
  // 1. Validate
  const validation = this.validate(input);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(', '),
      confidence: 0
    };
  }

  try {
    // 2. Gather evidence with skills
    const evidence1 = await this.skill1.execute(input.data);
    const evidence2 = await this.skill2.execute(input.data);

    // 3. Evaluate and synthesize
    const diagnosis = {
      root_cause: this.synthesizeCause(evidence1, evidence2),
      evidence: [...evidence1.evidence, ...evidence2.evidence],
      confidence: this.calculateConfidence(evidence1, evidence2),
      suggestions: this.generateSuggestions(evidence1, evidence2)
    };

    // 4. Return structured output
    return {
      success: true,
      diagnosis,
      citations: evidence1.evidence
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      confidence: 0
    };
  }
}

synthesizeCause(evidence1, evidence2) {
  // Logic to determine root cause from evidence
}

calculateConfidence(evidence1, evidence2) {
  // Logic to score confidence based on evidence quality
}

generateSuggestions(evidence1, evidence2) {
  // Generate actionable next steps
}
```

### Step 5: Register Agent

Create `src/custom-agents/my-agent.js`:

```javascript
import { Skill1 } from '../custom-skills/skill-1.js';
import { Skill2 } from '../custom-skills/skill-2.js';

export class MyAgent {
  // Implementation (steps 1-4)
}

export default MyAgent;
```

Export from `src/custom-agents/index.js`:

```javascript
import { MyAgent } from './my-agent.js';

export const customAgents = {
  MyAgent,
  DataAnalystAgent,
  // ... other agents
};

export function getAgent(name, options = {}) {
  const AgentClass = customAgents[name];
  if (!AgentClass) {
    throw new Error(`Agent not found: ${name}`);
  }
  return new AgentClass(options);
}
```

---

## Reference: 4 Example Agents

### 1. DataAnalyst Agent

**Location**: `src/custom-agents/data-analyst.js`

**Purpose**: Explores and analyzes data patterns, identifies anomalies, provides insights.

**Skills Used**:
- MetricsAnalyzer - Find anomalies and trends
- DataValidator - Validate data types

**Responsibilities**:
- Analyze data structure (object, array, primitive)
- Detect anomalies using IQR method
- Detect trends in time series
- Find correlations between fields

**Example Usage**:

```javascript
import { DataAnalystAgent } from '../custom-agents/data-analyst.js';

const agent = new DataAnalystAgent();

const diagnosis = await agent.analyze({
  data: [100, 105, 110, 115, 450, 455, 120, 125],
  analysisType: 'anomalies',
  context: 'Production error rate spike'
});

// Returns:
// {
//   insights: [
//     { type: 'anomalies', description: 'Found 2 anomalies...', evidence: '...' }
//   ],
//   anomalies: [
//     { index: 4, value: 450, severity: 'high' },
//     { index: 5, value: 455, severity: 'high' }
//   ],
//   confidence: 0.95,
//   suggestions: ['Investigate spike', 'Check for external factors']
// }
```

---

### 2. SecurityAuditor Agent

**Purpose**: Audits code and configurations for security issues and compliance violations.

**Skills Used**:
- DataValidator - Validate security constraints
- ChangeDetector - Find risky changes
- ResponseParser - Parse security logs

**Responsibilities**:
- Detect exposed credentials (API keys, passwords)
- Check for insecure dependencies
- Identify missing authentication
- Find privilege escalation risks
- Verify compliance with policies

**Example Implementation**:

```javascript
import { DataValidator } from '../custom-skills/data-validator.js';
import { ChangeDetector } from '../custom-skills/change-detector.js';

export class SecurityAuditorAgent {
  constructor(options = {}) {
    this.validator = new DataValidator();
    this.changeDetector = new ChangeDetector();
    this.policies = options.policies || {};
  }

  async audit(input) {
    const validation = this.validate(input);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    const issues = [];

    // Check for exposed credentials
    const credentialIssues = await this.checkCredentials(input.code);
    issues.push(...credentialIssues);

    // Check for insecure dependencies
    const depIssues = await this.checkDependencies(input.dependencies);
    issues.push(...depIssues);

    // Check for policy violations
    const policyIssues = this.checkPolicies(input.code);
    issues.push(...policyIssues);

    return {
      success: true,
      issues,
      confidence: this.calculateConfidence(issues),
      recommendations: this.generateRecommendations(issues)
    };
  }

  async checkCredentials(code) {
    // Pattern match for exposed API keys, passwords, tokens
    const patterns = [
      { regex: /api[_-]?key\s*[:=]\s*["']([^"']+)["']/gi, type: 'API_KEY' },
      { regex: /password\s*[:=]\s*["']([^"']+)["']/gi, type: 'PASSWORD' },
      { regex: /token\s*[:=]\s*["']([^"']{20,})["']/gi, type: 'TOKEN' }
    ];

    const issues = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(code)) !== null) {
        issues.push({
          type: pattern.type,
          severity: 'CRITICAL',
          line: code.substring(0, match.index).split('\n').length,
          recommendation: 'Move to environment variables or secrets manager'
        });
      }
    }
    return issues;
  }

  async checkDependencies(dependencies) {
    // Check for known vulnerable packages
    const knownVulnerable = [
      'lodash@<4.17.20',
      'moment@<2.29.0',
      'axios@<0.26.0'
    ];

    const issues = [];
    dependencies?.forEach(dep => {
      if (knownVulnerable.some(vuln => dep.includes(vuln))) {
        issues.push({
          type: 'VULNERABLE_DEPENDENCY',
          severity: 'HIGH',
          package: dep,
          recommendation: `Update to latest secure version`
        });
      }
    });
    return issues;
  }

  checkPolicies(code) {
    // Check against configured policies
    const issues = [];
    // Implementation specific to your policies
    return issues;
  }

  calculateConfidence(issues) {
    return issues.length === 0 ? 0.99 : (issues.length > 10 ? 0.70 : 0.85);
  }

  generateRecommendations(issues) {
    return issues.map(issue => ({
      issue: issue.type,
      action: issue.recommendation
    }));
  }

  validate(input) {
    const errors = [];
    if (!input.code) errors.push('Input.code is required');
    return { valid: errors.length === 0, errors };
  }

  static metadata() {
    return {
      name: 'SecurityAuditorAgent',
      version: '1.0.0',
      description: 'Audits code and configs for security issues',
      inputs: { code: 'string', dependencies: 'string[]' },
      outputs: { issues: 'object[]', confidence: 'number' }
    };
  }
}
```

**Example Usage**:

```javascript
const auditor = new SecurityAuditorAgent({
  policies: { requiresAuth: true, allowsPlaintext: false }
});

const result = await auditor.audit({
  code: `
    const apiKey = "sk_live_abc123xyz";
    const config = { username: 'admin', password: 'hardcoded' };
  `,
  dependencies: ['express@5.2.1', 'lodash@4.15.0']
});

// Returns: { issues: [{type: 'API_KEY', ...}, {type: 'PASSWORD', ...}, ...] }
```

---

### 3. PerformanceOptimizer Agent

**Purpose**: Identifies performance bottlenecks and recommends optimizations.

**Skills Used**:
- MetricsAnalyzer - Find performance anomalies
- ChangeDetector - Correlate changes to slowdowns
- DataValidator - Verify performance constraints

**Responsibilities**:
- Detect slow queries
- Identify memory leaks
- Find N+1 query problems
- Suggest caching strategies
- Recommend scaling strategies

**Example Implementation**:

```javascript
export class PerformanceOptimizerAgent {
  constructor(options = {}) {
    this.metricsAnalyzer = new MetricsAnalyzer();
    this.changeDetector = new ChangeDetector();
    this.thresholds = options.thresholds || {
      p95_latency_ms: 500,
      p99_latency_ms: 1000,
      memory_percent: 80,
      error_rate: 0.01
    };
  }

  async analyze(input) {
    const validation = this.validate(input);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    const findings = {
      bottlenecks: [],
      optimizations: [],
      priority: 'normal'
    };

    // Analyze latency trends
    if (input.latencies) {
      const latencyAnalysis = await this.metricsAnalyzer.execute({
        metric: 'latency',
        data: input.latencies,
        analysisType: 'anomalies',
        baseline: input.sla_latency_ms || 100
      });

      if (latencyAnalysis.success && latencyAnalysis.anomalies.length > 0) {
        findings.bottlenecks.push({
          type: 'SLOW_ENDPOINT',
          p95: this.calculatePercentile(input.latencies, 0.95),
          recommendation: 'Optimize queries or add caching'
        });
      }
    }

    // Analyze memory trends
    if (input.memory_usage) {
      const memoryAnalysis = await this.metricsAnalyzer.execute({
        metric: 'memory',
        data: input.memory_usage,
        analysisType: 'trend'
      });

      if (memoryAnalysis.data.trend === 'increasing') {
        findings.bottlenecks.push({
          type: 'MEMORY_LEAK',
          trend: 'increasing',
          recommendation: 'Add memory profiling to find leak'
        });
      }
    }

    // Correlate with code changes
    const changes = await this.changeDetector.execute({
      type: 'code',
      since: new Date(Date.now() - 3600000).toISOString()
    });

    findings.optimizations = this.generateOptimizations(
      findings.bottlenecks,
      changes.data
    );

    return {
      success: true,
      findings,
      confidence: this.calculateConfidence(findings)
    };
  }

  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile * sorted.length) - 1);
    return sorted[Math.max(0, index)];
  }

  generateOptimizations(bottlenecks, changes) {
    return bottlenecks.map(bn => ({
      bottleneck: bn.type,
      optimization: bn.recommendation,
      priority: 'high'
    }));
  }

  calculateConfidence(findings) {
    const bottleneckCount = findings.bottlenecks.length;
    return bottleneckCount === 0 ? 0.95 : (bottleneckCount > 5 ? 0.70 : 0.85);
  }

  validate(input) {
    const errors = [];
    if (!input) errors.push('Input is required');
    return { valid: errors.length === 0, errors };
  }

  static metadata() {
    return {
      name: 'PerformanceOptimizerAgent',
      version: '1.0.0',
      description: 'Identifies and recommends performance optimizations',
      inputs: {
        latencies: 'number[]',
        memory_usage: 'number[]',
        sla_latency_ms: 'number?'
      },
      outputs: {
        bottlenecks: 'object[]',
        optimizations: 'object[]',
        confidence: 'number'
      }
    };
  }
}
```

---

### 4. ComplianceChecker Agent

**Purpose**: Verifies code and deployment compliance with regulations and policies.

**Skills Used**:
- DataValidator - Verify policy constraints
- ResponseParser - Parse compliance logs
- ChangeDetector - Track compliance changes

**Responsibilities**:
- Check GDPR data handling
- Verify logging is enabled
- Confirm encryption is in use
- Check access controls
- Validate audit trails

**Example Implementation**:

```javascript
export class ComplianceCheckerAgent {
  constructor(options = {}) {
    this.validator = new DataValidator();
    this.policies = options.policies || {
      requiresDataEncryption: true,
      requiresAuditLog: true,
      gdprCompliant: true,
      requiresAuth: true
    };
  }

  async check(input) {
    const validation = this.validate(input);
    if (!validation.valid) {
      return { success: false, error: validation.errors[0] };
    }

    const findings = {
      compliant: true,
      violations: [],
      requirements_met: []
    };

    // Check encryption
    const encryptionCheck = this.checkEncryption(input.code);
    if (!encryptionCheck.compliant) {
      findings.violations.push(encryptionCheck.violation);
      findings.compliant = false;
    } else {
      findings.requirements_met.push('Data encryption enabled');
    }

    // Check audit logging
    const loggingCheck = this.checkAuditLogging(input.code);
    if (!loggingCheck.compliant) {
      findings.violations.push(loggingCheck.violation);
      findings.compliant = false;
    } else {
      findings.requirements_met.push('Audit logging configured');
    }

    // Check GDPR compliance
    const gdprCheck = this.checkGDPR(input.database_schema);
    if (!gdprCheck.compliant) {
      findings.violations.push(gdprCheck.violation);
      findings.compliant = false;
    } else {
      findings.requirements_met.push('GDPR controls present');
    }

    return {
      success: true,
      findings,
      confidence: findings.compliant ? 0.95 : 0.80,
      remediation: this.generateRemediation(findings.violations)
    };
  }

  checkEncryption(code) {
    const hasEncryption = /crypto|bcrypt|encrypt/i.test(code);
    return {
      compliant: hasEncryption,
      violation: hasEncryption ? null : {
        requirement: 'Data Encryption',
        status: 'FAILED',
        impact: 'CRITICAL',
        remediation: 'Implement crypto for sensitive data'
      }
    };
  }

  checkAuditLogging(code) {
    const hasAuditLog = /audit|log.*action|log.*user/i.test(code);
    return {
      compliant: hasAuditLog,
      violation: hasAuditLog ? null : {
        requirement: 'Audit Logging',
        status: 'FAILED',
        impact: 'HIGH',
        remediation: 'Add audit logging for user actions'
      }
    };
  }

  checkGDPR(schema) {
    const hasRightToDelete = /soft_delete|is_deleted|deletion_flag/i.test(schema);
    return {
      compliant: hasRightToDelete,
      violation: hasRightToDelete ? null : {
        requirement: 'GDPR Right to Delete',
        status: 'FAILED',
        impact: 'CRITICAL',
        remediation: 'Implement soft delete mechanism'
      }
    };
  }

  generateRemediation(violations) {
    return violations.map(v => ({
      requirement: v.requirement,
      action: v.remediation
    }));
  }

  validate(input) {
    const errors = [];
    if (!input) errors.push('Input is required');
    return { valid: errors.length === 0, errors };
  }

  static metadata() {
    return {
      name: 'ComplianceCheckerAgent',
      version: '1.0.0',
      description: 'Verifies compliance with regulations and policies',
      inputs: { code: 'string', database_schema: 'string' },
      outputs: {
        compliant: 'boolean',
        violations: 'object[]',
        requirements_met: 'string[]'
      }
    };
  }
}
```

---

## Using Skills in Agents

### Pattern 1: Sequential Skills

Use when one skill depends on the output of another.

```javascript
async diagnose(input) {
  // Step 1: Validate data structure
  const validation = await this.validator.execute({
    data: input.data,
    rules: this.schema
  });

  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  // Step 2: Use validated data
  const analysis = await this.analyzer.execute({
    data: validation.data,
    type: input.analysisType
  });

  return analysis;
}
```

### Pattern 2: Parallel Skills

Use when skills are independent and can run simultaneously.

```javascript
async diagnose(input) {
  // Run multiple skills in parallel
  const [skillAResult, skillBResult, skillCResult] = await Promise.all([
    this.skillA.execute(input),
    this.skillB.execute(input),
    this.skillC.execute(input)
  ]);

  // Combine results
  return {
    success: true,
    data: this.synthesize(skillAResult, skillBResult, skillCResult)
  };
}
```

### Pattern 3: Conditional Skills

Use when skill usage depends on input type or prior results.

```javascript
async diagnose(input) {
  let results = [];

  if (input.type === 'array') {
    const arrayAnalysis = await this.arrayAnalyzer.execute(input);
    results.push(arrayAnalysis);
  }

  if (input.type === 'object') {
    const objectAnalysis = await this.objectAnalyzer.execute(input);
    results.push(objectAnalysis);
  }

  // Check if we need deeper analysis
  if (results[0].confidence < 0.8) {
    const deepAnalysis = await this.deepAnalyzer.execute(input);
    results.push(deepAnalysis);
  }

  return { success: true, data: results };
}
```

### Pattern 4: Fallback Skills

Use when you want to try multiple approaches.

```javascript
async diagnose(input) {
  try {
    // Try primary skill
    return await this.primarySkill.execute(input);
  } catch (err) {
    // Fall back to secondary
    return await this.secondarySkill.execute(input);
  }
}
```

---

## Async/Await Patterns

### Pattern 1: Error Handling

```javascript
async diagnose(input) {
  try {
    const result = await this.skill.execute(input);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        confidence: 0
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`,
      confidence: 0
    };
  }
}
```

### Pattern 2: Timeout Protection

```javascript
async diagnose(input) {
  const timeout = (promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);

  try {
    const result = await timeout(
      this.skill.execute(input),
      5000  // 5 second timeout
    );
    return result;
  } catch (err) {
    return {
      success: false,
      error: err.message,
      confidence: 0
    };
  }
}
```

### Pattern 3: Retry Logic

```javascript
async diagnose(input) {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.skill.execute(input);
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, i)));
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} retries: ${lastError.message}`,
    confidence: 0
  };
}
```

### Pattern 4: Promise.all with Recovery

```javascript
async diagnose(input) {
  const results = await Promise.allSettled([
    this.skill1.execute(input),
    this.skill2.execute(input),
    this.skill3.execute(input)
  ]);

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);

  return {
    success: successful.length > 0,
    successful,
    failed,
    confidence: successful.length / results.length
  };
}
```

---

## Testing Agents

### Unit Test Template

```javascript
import { MyAgent } from '../my-agent.js';

describe('MyAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new MyAgent();
  });

  describe('validate()', () => {
    it('accepts valid input', () => {
      const validation = agent.validate({
        data: { /* valid data */ }
      });
      expect(validation.valid).toBe(true);
    });

    it('rejects invalid input', () => {
      const validation = agent.validate({
        // missing required field
      });
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('diagnose()', () => {
    it('returns structured diagnosis on valid input', async () => {
      const result = await agent.diagnose({
        data: { /* test data */ }
      });

      expect(result.success).toBe(true);
      expect(result.root_cause).toBeDefined();
      expect(result.evidence).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('returns error on invalid input', async () => {
      const result = await agent.diagnose({
        // invalid input
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.confidence).toBe(0);
    });

    it('provides evidence citations', async () => {
      const result = await agent.diagnose({
        data: { /* test data */ }
      });

      expect(Array.isArray(result.evidence)).toBe(true);
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('sets appropriate confidence score', async () => {
      const result = await agent.diagnose({
        data: { /* test data */ }
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('metadata()', () => {
    it('returns metadata', () => {
      const meta = MyAgent.metadata();

      expect(meta.name).toBeDefined();
      expect(meta.version).toBeDefined();
      expect(meta.description).toBeDefined();
    });
  });
});
```

### Integration Test Template

```javascript
import { MyAgent } from '../my-agent.js';
import { Skill1 } from '../../custom-skills/skill-1.js';
import { Skill2 } from '../../custom-skills/skill-2.js';

describe('MyAgent Integration', () => {
  let agent;

  beforeEach(() => {
    agent = new MyAgent();
  });

  it('uses skills correctly in diagnosis workflow', async () => {
    // Use realistic test data
    const testData = { /* complex scenario */ };

    const result = await agent.diagnose(testData);

    expect(result.success).toBe(true);
    // Verify skills were used
    expect(result.root_cause).toBeDefined();
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it('synthesizes evidence from multiple skills', async () => {
    const testData = { /* multi-part scenario */ };

    const result = await agent.diagnose(testData);

    // Should have evidence from both skills
    const evidenceTypes = result.evidence.map(e => e.type);
    expect(evidenceTypes).toContain('skill1_type');
    expect(evidenceTypes).toContain('skill2_type');
  });

  it('handles skill failures gracefully', async () => {
    // Mock skill to return error
    agent.skill1 = {
      execute: async () => ({ success: false, error: 'Skill failed' })
    };

    const result = await agent.diagnose({ data: 'test' });

    // Should return error, not crash
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Testing Best Practices

1. **Test validation separately**
   ```javascript
   describe('validate()', () => {
     // Test valid and invalid inputs
   });
   ```

2. **Mock skills for unit tests**
   ```javascript
   const mockSkill = {
     execute: jest.fn().mockResolvedValue({ success: true, data: {...} })
   };
   agent.skill = mockSkill;
   ```

3. **Use real skills for integration tests**
   ```javascript
   // Don't mock - use actual skill instances
   agent = new MyAgent();
   const result = await agent.diagnose(realData);
   ```

4. **Test edge cases**
   - Empty data
   - Null/undefined values
   - Out-of-range values
   - Missing required fields

5. **Verify evidence is provided**
   ```javascript
   expect(result.evidence).toBeDefined();
   expect(Array.isArray(result.evidence)).toBe(true);
   ```

---

## Constraints and Guardrails

### Agents MUST:
- ✓ Be deterministic within statistical limits (same input ≈ same diagnosis)
- ✓ Validate input before processing
- ✓ Use skills for evidence gathering
- ✓ Provide structured output
- ✓ Include confidence scores
- ✓ Handle errors gracefully
- ✓ Use async/await for skill calls

### Agents MUST NOT:
- ✗ Make network calls directly (use skills)
- ✗ Write files or modify state
- ✗ Access environment variables directly
- ✗ Throw uncaught exceptions
- ✗ Call other agents directly (use orchestrator)
- ✗ Assume specific file structure

### Why These Rules?

**Determinism**: Diagnosis reproducibility is crucial for verification.

**Validation**: Bad input should be rejected clearly, not crash.

**Skills**: Separation of concerns - agents coordinate, skills compute.

**Structured output**: Downstream processing depends on consistent format.

**Confidence**: Without confidence, output is useless.

**Error handling**: Errors should be returned as data, not thrown.

**Async/await**: Enables parallel skill execution and timeout management.

---

## Next Steps

- Read [CUSTOM_SKILLS_API.md](./CUSTOM_SKILLS_API.md) to understand skills better
- Review [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for pipeline overview
- Check [../TESTING_GUIDE.md](../TESTING_GUIDE.md) for comprehensive testing examples
- See [../API.md](../API.md) for orchestrator integration
