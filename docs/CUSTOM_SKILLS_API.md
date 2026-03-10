# Custom Skills API

**Table of Contents**
1. [Overview](#overview)
2. [Skill Interface and Contract](#skill-interface-and-contract)
3. [Creating Custom Skills](#creating-custom-skills)
4. [Built-In Skills Reference](#built-in-skills-reference)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Testing Skills](#testing-skills)

---

## Overview

Skills are specialized, reusable functions that agents use to process data, analyze logs, validate information, and produce evidence. They are **not agents** - they don't make decisions or diagnose problems. Instead, they perform specific data operations that agents use to gather information.

### Skill vs Agent

| Aspect | Skill | Agent |
|--------|-------|-------|
| Purpose | Data operation | Decision making |
| Input | Structured data | Problem description |
| Output | Processed result | Diagnosis with evidence |
| Dependencies | None (standalone) | Uses multiple skills |
| Complexity | Simple, focused | Complex workflow |
| Testability | Unit test | Integration test |

### Skills in the Pipeline

```
Router Agent
    ↓
Retriever Agent (uses skills)
    ├── DataValidator (validates schema)
    ├── RequestFormatter (formats queries)
    ├── MetricsAnalyzer (analyzes metrics)
    └── ChangeDetector (finds recent changes)
    ↓
Skeptic Agent (uses skills)
    ├── MetricsAnalyzer (looks for anomalies)
    └── DataValidator (checks assumptions)
    ↓
Verifier Agent (uses skills)
    ├── DataValidator (validates all claims)
    └── ResponseParser (parses structured output)
    ↓
Critic Agent (uses skills)
    └── All of the above for quality gate
```

---

## Skill Interface and Contract

Every skill must implement this interface:

```javascript
class SkillName {
  /**
   * Create a new skill instance.
   * @param {object} options - Configuration options
   */
  constructor(options = {}) {
    // Initialize skill state
  }

  /**
   * Execute the skill operation.
   *
   * Must be deterministic - same input always produces same output.
   * Must not have side effects - no network calls, file writes, etc.
   *
   * @param {object} input - Structured input
   * @returns {Promise<object>|object} Result object with:
   *   - success: boolean (whether operation succeeded)
   *   - data: object (result data)
   *   - error?: string (error message if failed)
   *   - evidence?: string[] (citations backing the result)
   *   - confidence?: number (0-1, if applicable)
   */
  async execute(input) {
    // Perform skill operation
    return {
      success: true,
      data: result,
      evidence: citations,
      confidence: 0.95
    };
  }

  /**
   * Validate input before execution.
   * Called automatically by framework.
   *
   * @param {object} input - Input to validate
   * @returns {object} { valid: boolean, errors: string[] }
   */
  validate(input) {
    // Check input structure
    return { valid: true, errors: [] };
  }

  /**
   * Get skill metadata.
   *
   * @returns {object} { name, version, description, inputs, outputs }
   */
  static metadata() {
    return {
      name: 'SkillName',
      version: '1.0.0',
      description: 'What this skill does',
      inputs: {
        /* schema of execute() input */
      },
      outputs: {
        /* schema of execute() return value */
      }
    };
  }
}
```

### Result Object Contract

Every skill must return a result object:

```javascript
{
  // REQUIRED: Did the operation succeed?
  success: boolean,

  // REQUIRED: The processed data
  data: any,

  // OPTIONAL: Why it failed (if success=false)
  error?: string,

  // OPTIONAL: Citations backing the data
  evidence?: string[],

  // OPTIONAL: Confidence in result (0-1)
  confidence?: number,

  // OPTIONAL: Performance metrics
  duration_ms?: number,

  // OPTIONAL: Warnings or notes
  warnings?: string[]
}
```

---

## Creating Custom Skills

### Step 1: Define Skill Purpose

```javascript
/**
 * YourSkill
 *
 * What problem does it solve?
 * What data does it transform?
 * When would you use it?
 */
```

### Step 2: Implement Base Class

```javascript
class YourSkill {
  constructor(options = {}) {
    this.config = options;
  }

  async execute(input) {
    // Implementation
  }

  validate(input) {
    // Validation
  }

  static metadata() {
    return {
      name: 'YourSkill',
      version: '1.0.0',
      description: '...',
      inputs: { /* schema */ },
      outputs: { /* schema */ }
    };
  }
}
```

### Step 3: Add to Registry

In `src/custom-skills/index.js`:

```javascript
import { YourSkill } from './your-skill.js';

export const customSkills = {
  YourSkill,
  // ... other skills
};

export function getSkill(name, options = {}) {
  const SkillClass = customSkills[name];
  if (!SkillClass) {
    throw new Error(`Skill not found: ${name}`);
  }
  return new SkillClass(options);
}
```

### Step 4: Use in Agent

```javascript
import { DataValidator } from '../custom-skills/data-validator.js';

class MyAgent {
  constructor() {
    this.validator = new DataValidator();
  }

  async diagnose(input) {
    const validationResult = await this.validator.execute({
      data: input.payload,
      rules: this.schema
    });

    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error}`);
    }

    // Use validated data
    return validationResult.data;
  }
}
```

---

## Built-In Skills Reference

### 1. DataValidator

**Purpose**: Validates data types, ranges, formats, and object structures.

**Location**: `src/custom-skills/data-validator.js`

**Use Cases**:
- Validate API request payloads
- Verify database records match schema
- Check configuration values are in allowed ranges
- Validate log entry fields

**Example**:

```javascript
import { DataValidator } from '../custom-skills/data-validator.js';

const validator = new DataValidator();

// Validate single value
const result = await validator.execute({
  data: 42,
  rules: [
    { type: 'number', min: 0, max: 100 }
  ]
});

// Validate object structure
const objResult = await validator.execute({
  data: { name: 'Alice', age: 30, email: 'alice@example.com' },
  schema: {
    name: [{ type: 'string', minLength: 1 }],
    age: [{ type: 'number', min: 0, max: 150 }],
    email: [{ type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }]
  }
});
```

**Rules**:
- `type`: 'string|number|boolean|object|array'
- `min`, `max`: For numeric ranges
- `minLength`, `maxLength`: For strings
- `pattern`: RegExp for format validation
- `enum`: Array of allowed values
- `required`: Field must be present

**Output**:
```javascript
{
  success: true,
  data: null,
  evidence: ['Input: 42', 'Rule: type=number, min=0, max=100'],
  confidence: 1.0,
  errors: []  // Empty if valid
}
```

---

### 2. RequestFormatter

**Purpose**: Formats queries, API calls, and data requests for consistency.

**Location**: `src/custom-skills/request-formatter.js`

**Use Cases**:
- Format database queries consistently
- Build API request bodies
- Normalize command-line arguments
- Create log queries

**Example**:

```javascript
import { RequestFormatter } from '../custom-skills/request-formatter.js';

const formatter = new RequestFormatter();

// Format database query
const result = await formatter.execute({
  type: 'sql',
  template: 'SELECT * FROM {table} WHERE {field} = {value}',
  values: {
    table: 'users',
    field: 'id',
    value: 123
  }
});
// Returns: 'SELECT * FROM users WHERE id = 123'

// Format API request
const apiResult = await formatter.execute({
  type: 'http',
  method: 'POST',
  path: '/api/users/{id}/profile',
  params: { id: 123 },
  headers: { 'Content-Type': 'application/json' },
  body: { name: 'Alice' }
});
```

**Supported Types**:
- `sql` - Database queries
- `http` - REST API requests
- `graphql` - GraphQL queries
- `cli` - Command-line arguments
- `log_query` - Log search queries

**Output**:
```javascript
{
  success: true,
  data: {
    formatted: 'SELECT * FROM users WHERE id = 123',
    params: { table: 'users', ... },
    variable_count: 3
  },
  evidence: ['Template: SELECT * FROM ...', 'Values: {table: users, ...}']
}
```

---

### 3. ResponseParser

**Purpose**: Parses structured responses (JSON, CSV, logs) and extracts relevant fields.

**Location**: `src/custom-skills/response-parser.js`

**Use Cases**:
- Parse API JSON responses
- Extract fields from log lines
- Parse CSV data
- Extract metrics from metrics output

**Example**:

```javascript
import { ResponseParser } from '../custom-skills/response-parser.js';

const parser = new ResponseParser();

// Parse JSON response
const result = await parser.execute({
  input: { user: { id: 1, name: 'Alice', email: 'alice@example.com' } },
  format: 'json',
  extract: ['user.id', 'user.email'],
  transform: { email: 'toLowerCase' }
});
// Returns: { id: 1, email: 'alice@example.com' }

// Parse log line
const logResult = await parser.execute({
  input: '2024-03-09T15:30:12Z [ERROR] Pool exhausted: waiting for connection',
  format: 'log',
  pattern: /\[(\w+)\] (.+)/,
  fields: ['level', 'message']
});
// Returns: { level: 'ERROR', message: 'Pool exhausted: ...' }

// Parse CSV
const csvResult = await parser.execute({
  input: 'id,name,age\n1,Alice,30\n2,Bob,25',
  format: 'csv',
  headers: true
});
// Returns: [{ id: '1', name: 'Alice', age: '30' }, ...]
```

**Formats**:
- `json` - JSON objects
- `log` - Log line strings with regex
- `csv` - Comma/tab-separated values
- `yaml` - YAML structures
- `plain` - Plain text with field extraction

**Output**:
```javascript
{
  success: true,
  data: { /* extracted fields */ },
  evidence: [
    'Parsed format: json',
    'Extracted fields: user.id, user.email',
    'Applied transforms: email'
  ]
}
```

---

### 4. MetricsAnalyzer

**Purpose**: Analyzes time-series metrics to find anomalies, trends, and correlations.

**Location**: `src/custom-skills/metrics-analyzer.js`

**Use Cases**:
- Detect metric anomalies (spikes, dips)
- Find when metrics changed
- Correlate multiple metrics
- Identify trends (increasing/decreasing)

**Example**:

```javascript
import { MetricsAnalyzer } from '../custom-skills/metrics-analyzer.js';

const analyzer = new MetricsAnalyzer();

// Detect anomalies
const result = await analyzer.execute({
  metric: 'error_rate',
  data: [0.01, 0.01, 0.02, 0.015, 0.45, 0.50, 0.48, 0.02, 0.01],
  analysisType: 'anomalies',
  baseline: 0.02,
  threshold: 0.1  // Alert if > 10% above baseline
});

// Detect trend
const trendResult = await analyzer.execute({
  metric: 'response_time_ms',
  data: [100, 105, 110, 115, 120, 118, 122, 125],
  analysisType: 'trend',
  window: 'last_hour'
});
// Returns: { trend: 'increasing', change_percent: 25 }

// Find correlation
const corrResult = await analyzer.execute({
  metrics: {
    error_rate: [0.01, 0.01, 0.45, 0.50, 0.02, 0.01],
    cpu_usage: [20, 22, 85, 90, 25, 18],
    memory_mb: [500, 510, 1200, 1300, 550, 480]
  },
  analysisType: 'correlation',
  pairs: ['error_rate:cpu_usage', 'error_rate:memory_mb']
});
```

**Analysis Types**:
- `anomalies` - Find outliers using IQR method
- `trend` - Detect increasing/decreasing pattern
- `correlation` - Find relationships between metrics
- `seasonality` - Find recurring patterns
- `change_point` - Find when data changed

**Output**:
```javascript
{
  success: true,
  data: {
    anomalies: [
      { index: 4, value: 0.45, severity: 'high', reason: 'Above baseline' }
    ],
    baseline: 0.02,
    threshold: 0.1,
    anomaly_count: 2
  },
  confidence: 0.95,
  evidence: [
    'Baseline: 0.02 (average of first 3 points)',
    'Threshold: 0.1 (5x baseline)',
    'Anomalies found at indices: 4, 5'
  ]
}
```

---

### 5. ChangeDetector

**Purpose**: Identifies recent changes to code, config, and infrastructure.

**Location**: `src/custom-skills/change-detector.js`

**Use Cases**:
- Find recent code changes that might cause issue
- Identify config changes matching incident time
- Detect infrastructure changes (scaling, updates)
- Timeline changes relative to incident

**Example**:

```javascript
import { ChangeDetector } from '../custom-skills/change-detector.js';

const detector = new ChangeDetector();

// Find code changes in timeframe
const result = await detector.execute({
  type: 'code',
  path: 'src/',
  since: '2024-03-09T14:00:00Z',
  until: '2024-03-09T16:00:00Z'
});
// Returns: [
//   { file: 'src/database.js', changed: '2024-03-09T14:30Z', author: 'alice' },
//   { file: 'src/analytics.js', changed: '2024-03-09T14:35Z', author: 'bob' }
// ]

// Find config changes
const configResult = await detector.execute({
  type: 'config',
  path: 'config/prod.yaml',
  since: '2024-03-09T14:00:00Z'
});
// Returns: changes with before/after values

// Find deployments
const deployResult = await detector.execute({
  type: 'deployment',
  since: '2024-03-09T12:00:00Z',
  service: 'api'
});
```

**Types**:
- `code` - Git commits
- `config` - Configuration file changes
- `deployment` - Service deployments
- `infrastructure` - Resource scaling, updates
- `schema` - Database schema migrations

**Output**:
```javascript
{
  success: true,
  data: [
    {
      type: 'code',
      file: 'src/database.js',
      timestamp: '2024-03-09T14:30:00Z',
      author: 'alice',
      message: 'Add analytics feature',
      changes: { additions: 45, deletions: 2 }
    }
  ],
  evidence: [
    'src/database.js - changed 2024-03-09 14:30 by alice'
  ]
}
```

---

## Error Handling Patterns

### Pattern 1: Validation Before Execution

```javascript
async execute(input) {
  // Always validate first
  const validation = this.validate(input);
  if (!validation.valid) {
    return {
      success: false,
      data: null,
      error: `Validation failed: ${validation.errors.join(', ')}`,
      evidence: validation.errors
    };
  }

  try {
    // Perform operation
    const result = performOperation(input);
    return {
      success: true,
      data: result,
      evidence: generateEvidence(input, result)
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err.message,
      evidence: [`Error: ${err.message}`]
    };
  }
}
```

### Pattern 2: Graceful Degradation

```javascript
async execute(input) {
  const result = {
    success: false,
    data: null,
    warnings: [],
    error: null
  };

  try {
    // Try primary method
    result.data = this.primaryMethod(input);
    result.success = true;
  } catch (err) {
    result.warnings.push(`Primary method failed: ${err.message}`);

    try {
      // Fall back to alternative
      result.data = this.fallbackMethod(input);
      result.success = true;
      result.warnings.push('Using fallback method');
    } catch (fallbackErr) {
      result.error = `All methods failed: ${fallbackErr.message}`;
    }
  }

  return result;
}
```

### Pattern 3: Structured Error Context

```javascript
async execute(input) {
  try {
    return {
      success: true,
      data: performOperation(input),
      confidence: 0.95
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err.message,
      context: {
        input: JSON.stringify(input),
        stack: err.stack,
        type: err.constructor.name
      },
      evidence: [
        `Error type: ${err.constructor.name}`,
        `Message: ${err.message}`,
        `Input was: ${JSON.stringify(input)}`
      ]
    };
  }
}
```

---

## Testing Skills

### Unit Test Template

```javascript
import { YourSkill } from '../your-skill.js';

describe('YourSkill', () => {
  let skill;

  beforeEach(() => {
    skill = new YourSkill();
  });

  describe('validate()', () => {
    it('accepts valid input', () => {
      const validation = skill.validate({
        data: 'test',
        rules: [{ type: 'string' }]
      });
      expect(validation.valid).toBe(true);
    });

    it('rejects invalid input', () => {
      const validation = skill.validate({
        data: 42,
        rules: [{ type: 'string' }]
      });
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('execute()', () => {
    it('returns success result on valid input', async () => {
      const result = await skill.execute({
        data: 'test',
        rules: [{ type: 'string', minLength: 2 }]
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.evidence).toBeDefined();
    });

    it('returns error result on invalid input', async () => {
      const result = await skill.execute({
        data: 'a',
        rules: [{ type: 'string', minLength: 2 }]
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('provides evidence citations', async () => {
      const result = await skill.execute({
        data: 42,
        rules: [{ type: 'number', min: 0, max: 100 }]
      });

      expect(result.evidence).toBeDefined();
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('sets confidence score if applicable', async () => {
      const result = await skill.execute({
        data: [0.01, 0.01, 0.45, 0.50, 0.02],
        analysisType: 'anomalies'
      });

      if (result.confidence !== undefined) {
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('metadata()', () => {
    it('returns metadata', () => {
      const meta = YourSkill.metadata();

      expect(meta.name).toBeDefined();
      expect(meta.version).toBeDefined();
      expect(meta.description).toBeDefined();
      expect(meta.inputs).toBeDefined();
      expect(meta.outputs).toBeDefined();
    });
  });
});
```

### Integration Test Template

```javascript
import { DataAnalystAgent } from '../agents/data-analyst.js';
import { MetricsAnalyzer } from '../custom-skills/metrics-analyzer.js';

describe('DataAnalystAgent with MetricsAnalyzer', () => {
  let agent;

  beforeEach(() => {
    agent = new DataAnalystAgent();
  });

  it('uses skill correctly in diagnosis workflow', async () => {
    const diagnosis = await agent.analyze({
      data: [100, 105, 110, 115, 450, 455, 120, 125],
      analysisType: 'anomalies',
      context: 'Production error rate spike'
    });

    expect(diagnosis.insights).toBeDefined();
    expect(diagnosis.anomalies.length).toBeGreaterThan(0);
    expect(diagnosis.confidence).toBeGreaterThanOrEqual(0);
  });
});
```

### Testing Best Practices

1. **Test validation separately from execution**
   - Verify invalid inputs are caught
   - Verify valid inputs pass through

2. **Verify evidence is provided**
   - Each result should have evidence array
   - Evidence should be human-readable citations

3. **Check error messages are clear**
   - Not just "error: true"
   - Include what went wrong and why

4. **Test edge cases**
   - Empty arrays
   - Null/undefined values
   - Out-of-range numbers
   - Missing fields

5. **Verify determinism**
   - Same input → same output every time
   - No random behavior
   - No timing-dependent behavior

---

## Registering Custom Skills

### Step 1: Create Skill File

Create `src/custom-skills/my-skill.js`:

```javascript
export class MySkill {
  constructor(options = {}) {
    this.config = options;
  }

  async execute(input) {
    const validation = this.validate(input);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors[0]
      };
    }

    return {
      success: true,
      data: processInput(input)
    };
  }

  validate(input) {
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Input must be an object'] };
    }
    return { valid: true, errors: [] };
  }

  static metadata() {
    return {
      name: 'MySkill',
      version: '1.0.0',
      description: 'Does something useful',
      inputs: { /* schema */ },
      outputs: { /* schema */ }
    };
  }
}
```

### Step 2: Export from Index

Edit `src/custom-skills/index.js`:

```javascript
import { MySkill } from './my-skill.js';

export const customSkills = {
  DataValidator,
  RequestFormatter,
  ResponseParser,
  MetricsAnalyzer,
  ChangeDetector,
  MySkill  // <-- Add here
};
```

### Step 3: Use in Agent

```javascript
import { MySkill } from '../custom-skills/my-skill.js';

class MyAgent {
  constructor() {
    this.skill = new MySkill();
  }

  async process(data) {
    const result = await this.skill.execute(data);
    if (!result.success) throw new Error(result.error);
    return result.data;
  }
}
```

### Step 4: Test

```bash
npm test -- src/custom-skills/my-skill.test.js
```

---

## Constraints and Guardrails

### Skills MUST:
- ✓ Be deterministic (same input → same output)
- ✓ Be side-effect free (no file writes, network calls)
- ✓ Return structured result objects
- ✓ Provide evidence citations
- ✓ Validate input before processing
- ✓ Handle errors gracefully

### Skills MUST NOT:
- ✗ Make network calls or API requests
- ✗ Write files or modify state
- ✗ Access environment variables
- ✗ Create randomness or timing dependencies
- ✗ Throw exceptions (return error objects instead)
- ✗ Require specific file system structure

### Why These Rules?

**Determinism**: Agents need reproducible results for verification.

**No side effects**: Skills run in parallel; state changes cause races.

**Structured output**: Agents chain skill results; consistent format enables automation.

**Evidence**: Without citations, claims are worthless.

**Validation**: Bad input shouldn't crash; return error instead.

**Error handling**: Skills that throw are unpredictable; error objects are better.

---

## Next Steps

- Read [CUSTOM_AGENTS_API.md](./CUSTOM_AGENTS_API.md) to learn how agents use skills
- Review [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for pipeline overview
- Check [../TESTING_GUIDE.md](../TESTING_GUIDE.md) for comprehensive testing examples
