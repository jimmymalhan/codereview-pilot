# Integration Website - Guardrails & Skill/Agent Capabilities
**Version:** 2.1.0 | **Scope:** This PR Only

---

## Executive Guardrails

### Core Rules (Inherited from CLAUDE.md)
1. **Never invent fields, tables, APIs, regions, or files** — Everything displayed must be retrieved
2. **Retrieve before explaining** — No guessing, no hallucinations
3. **Verifier blocks unsupported nouns** — Claims must cite evidence
4. **Skeptic must produce materially different theory** — Not just shade on first answer
5. **No edits until plan approved** — Human review gate mandatory

### Zero-Secrets Policy
- ✓ No API keys in code, config, or commits
- ✓ No database credentials
- ✓ No user tokens or session secrets
- ✓ No authentication credentials for any service
- ✓ All .env files in .gitignore
- ✓ Pre-commit hooks block sensitive files

### Data Validation
- All user inputs validated before processing
- No SQL injection vectors
- No XSS vulnerabilities in web display
- No path traversal in file operations
- All file paths relative to repoRoot

### Website-Specific Rules
- Website serves ONLY read-only data
- No write operations allowed from web UI
- No direct file system manipulation
- MCP context providers used in read-only mode
- All evidence citations real and verifiable (file:line format)

---

## BUCKET 1: Plan & Guardrails (ACTIVE)

### 1.1 Skills & Agents Inventory

| Component | Type | Purpose | QA Gate |
|-----------|------|---------|---------|
| Router | Agent | Classify failure type | Must succeed in <2s |
| Retriever | Agent | Gather evidence | Must find file:line citations |
| Skeptic | Agent | Produce alternative | Must differ from Router |
| Verifier | Agent | Validate claims | Must cite evidence |
| Critic | Agent | Quality gate | Must enforce confidence ≥0.70 |
| Evidence Verifier | Skill | Validate citations | Must verify file exists |
| Hallucination Detector | Skill | Detect false claims | Must compute risk score |
| Confidence Scorer | Skill | Calculate confidence | Must show formula breakdown |
| DataValidator | Skill (NEW) | Type validation | Must validate all types |
| RequestFormatter | Skill (NEW) | API normalization | Must handle 5+ formats |
| ResponseParser | Skill (NEW) | JSON/XML parsing | Must parse correctly |
| MetricsAnalyzer | Skill (NEW) | Time-series | Must analyze trends |
| ChangeDetector | Skill (NEW) | Before/after | Must compute diffs |
| DataAnalyst | Agent (NEW) | Data exploration | Must not mutate data |
| SecurityAuditor | Agent (NEW) | Security check | Must find 0 false positives |
| PerformanceOptimizer | Agent (NEW) | Optimization | Must suggest real improvements |
| ComplianceChecker | Agent (NEW) | Compliance | Must reference standards |

### 1.2 Skill Capability Matrix

#### Evidence Verifier Skill (src/skills/evidence-verifier.js)
```javascript
CAN:
✓ Validate file:line citations exist in repository
✓ Validate ISO-8601 timestamps
✓ Validate claim text is non-empty
✓ Return list of validation issues

CANNOT:
✗ Modify any files
✗ Approve claims without citations
✗ Guess at file locations
✗ Accept claims without proper format
✗ Access external APIs

QA Gates:
- Input: Array of claims (max 50 items)
- Output: {valid: boolean, totalClaims: number, issues: Array}
- Timeout: <100ms per claim
- Error handling: throw on invalid input, return issues for invalid claims
- Coverage: ≥98% line coverage (currently 100%)
- Tests: 5+ test cases covering all paths

Example:
claims = [{
  text: "Connection pool exhausted",
  citation: "src/db/connection-pool.js:42",
  timestamp: "2024-03-09T15:30:00Z"
}]
result = {
  valid: true,
  totalClaims: 1,
  issues: []
}
```

#### Hallucination Detector Skill (src/skills/hallucination-detector.js)
```javascript
CAN:
✓ Detect non-existent fields in schema
✓ Detect non-existent API endpoints
✓ Detect non-existent functions in code
✓ Detect type mismatches against schema
✓ Compute hallucination risk score (0.0 - 1.0)

CANNOT:
✗ Modify any schema or code
✗ Prevent claims from being made
✗ Reject claims outright (only flag risk)
✗ Access external schemas
✗ Guess at field names

QA Gates:
- Input: Array of claims (max 50 items), optional schema
- Output: {riskScore: number, flaggedClaims: number, details: Array}
- Risk score: 0.0 (safe) to 1.0 (certain hallucination)
- Timeout: <50ms per claim
- Error handling: return riskScore 0.0 for string claims, process objects
- Coverage: ≥98% line coverage (currently 98.88%)
- Tests: 6+ test cases

Scoring: riskScore = min(1.0, flaggedClaims / totalClaims)
```

#### Confidence Scorer Skill (src/skills/confidence-scorer.js)
```javascript
CAN:
✓ Calculate confidence score (0.0 - 1.0)
✓ Weight: Evidence (0.25), Hallucination (0.35), Contradiction (0.20)
✓ Show formula breakdown
✓ Account for contradictions

CANNOT:
✗ Approve decisions (only score them)
✗ Change weightings without approval
✗ Reject evidence (only penalize uncertainty)
✗ Make recommendations

QA Gates:
- Input: {baseScore, claims, contradictions}
- Output: {confidence, baseScore, evidenceBonus, hallucinationPenalty, contradictionPenalty, breakdown}
- Formula: clamp(baseScore + evidence - hallucination - contradiction, 0, 1)
- Timeout: <100ms
- Error handling: clamp base score to [0, 1]
- Coverage: ≥98% (currently 100%)
- Tests: 8+ test cases

Example Breakdown:
"0.5 + 0.2 - 0.105 - 0.04 = 0.56" (56% confidence)
```

---

## Custom Skills (NEW)

### DataValidator Skill
```javascript
Location: src/custom-skills/data-validator.js

PURPOSE: Validate data types, ranges, formats

CAN:
✓ Validate primitive types (string, number, boolean)
✓ Validate array/object structure
✓ Validate value ranges (min/max)
✓ Validate string patterns (regex)
✓ Validate required fields
✓ Return detailed validation errors

CANNOT:
✗ Modify data
✗ Coerce types
✗ Access external validators
✗ Make assumptions about intent

QA GATES:
- Input validation: All rules must be objects
- Output: {valid: boolean, errors: Array<{field, message, value}>}
- Error count: Max 50 per validation
- Timeout: <50ms
- Tests: 10+ test cases
```

### RequestFormatter Skill
```javascript
Location: src/custom-skills/request-formatter.js

PURPOSE: Normalize API requests to standard format

CAN:
✓ Convert REST to standardized format
✓ Convert GraphQL to standardized format
✓ Extract headers, body, params
✓ Validate HTTP methods
✓ Normalize URLs

CANNOT:
✗ Make actual API calls
✗ Modify request content
✗ Bypass security headers
✗ Add authentication

QA GATES:
- Input: Raw request (object, string)
- Output: {method, url, headers, body, params}
- Support: GET, POST, PUT, DELETE, PATCH
- Timeout: <30ms
- Tests: 8+ test cases
```

### ResponseParser Skill
```javascript
Location: src/custom-skills/response-parser.js

PURPOSE: Parse API responses (JSON, XML, etc.)

CAN:
✓ Parse JSON responses
✓ Parse XML responses
✓ Parse HTML responses
✓ Extract status code and headers
✓ Handle nested structures
✓ Return structured data

CANNOT:
✗ Validate response semantics
✗ Execute response content
✗ Modify response data
✗ Call external parsers

QA GATES:
- Input: Raw response (string, buffer)
- Output: {status, headers, body, parsed}
- Error handling: Return parse error details
- Max payload: 10MB
- Timeout: <100ms
- Tests: 8+ test cases
```

### MetricsAnalyzer Skill
```javascript
Location: src/custom-skills/metrics-analyzer.js

PURPOSE: Analyze time-series metrics

CAN:
✓ Calculate mean, median, percentiles
✓ Detect spikes and anomalies
✓ Calculate trends (increasing/decreasing)
✓ Compare periods (before/after)
✓ Return statistical summary

CANNOT:
✗ Predict future values
✗ Modify metric data
✗ Access external metrics systems
✗ Make business recommendations

QA GATES:
- Input: Array of {timestamp, value} pairs
- Output: {mean, median, p95, p99, trend, anomalies}
- Min data points: 3
- Timeout: <100ms
- Tests: 10+ test cases
```

### ChangeDetector Skill
```javascript
Location: src/custom-skills/change-detector.js

PURPOSE: Detect differences between versions

CAN:
✓ Compare code files (line-by-line)
✓ Compare configurations (JSON/YAML)
✓ Compare schemas (field-by-field)
✓ Highlight added/removed/modified lines
✓ Show context (3 lines before/after)

CANNOT:
✗ Merge changes automatically
✗ Resolve conflicts
✗ Modify original files
✗ Make semantic judgments

QA GATES:
- Input: {before: string, after: string}
- Output: {added: [], removed: [], modified: []}
- Max file size: 1MB
- Context lines: 3
- Timeout: <100ms
- Tests: 8+ test cases
```

---

## Custom Agents (NEW)

### DataAnalyst Agent
```
Location: .claude/agents/data-analyst.md
Implementation: src/custom-agents/data-analyst.js

PURPOSE: Explore and understand data patterns

RESPONSIBILITIES:
✓ Analyze data structure and types
✓ Identify outliers and anomalies
✓ Suggest relevant metrics
✓ Find correlations
✓ Report findings with evidence

GUARDRAILS:
✗ Cannot modify original data
✗ Cannot make predictions without evidence
✗ Must cite specific data points
✗ Cannot recommend actions (only insights)

QA GATES:
- Input: Data source (logs, metrics, schema)
- Output: {insights: [], anomalies: [], suggestions: []}
- All findings must cite file:line or timestamp
- Timeout: <2 seconds
- Tests: 10+ test cases
```

### SecurityAuditor Agent
```
Location: .claude/agents/security-auditor.md
Implementation: src/custom-agents/security-auditor.js

PURPOSE: Check for security vulnerabilities

RESPONSIBILITIES:
✓ Scan for hardcoded secrets
✓ Check for SQL injection vectors
✓ Identify XSS vulnerabilities
✓ Verify authentication usage
✓ Report findings with severity

GUARDRAILS:
✗ Cannot modify code
✗ Cannot make false positive claims
✗ Must cite specific code locations
✗ Cannot recommend third-party tools without evidence

QA GATES:
- Input: Code files (JavaScript, SQL, etc.)
- Output: {vulnerabilities: [], severity: [], evidence: []}
- False positive rate: <5%
- Timeout: <3 seconds
- Coverage: OWASP Top 10 + CWE-33
- Tests: 15+ test cases with real/fake vulns
```

### PerformanceOptimizer Agent
```
Location: .claude/agents/performance-optimizer.md
Implementation: src/custom-agents/performance-optimizer.js

PURPOSE: Identify performance improvements

RESPONSIBILITIES:
✓ Analyze algorithm complexity
✓ Identify bottlenecks
✓ Suggest optimizations
✓ Estimate improvement potential
✓ Provide before/after comparison

GUARDRAILS:
✗ Cannot implement changes
✗ Cannot recommend without impact analysis
✗ Must cite specific code locations
✗ Must estimate improvement (%, timing)

QA GATES:
- Input: Code files + metrics
- Output: {bottlenecks: [], optimizations: [], impact: []}
- Improvement estimates must be quantified
- Timeout: <2 seconds
- Tests: 10+ test cases
```

### ComplianceChecker Agent
```
Location: .claude/agents/compliance-checker.md
Implementation: src/custom-agents/compliance-checker.js

PURPOSE: Verify regulatory compliance

RESPONSIBILITIES:
✓ Check GDPR compliance (data handling)
✓ Check HIPAA compliance (healthcare data)
✓ Check PCI-DSS compliance (payment data)
✓ Check SOC 2 requirements
✓ Report gaps with evidence

GUARDRAILS:
✗ Cannot guarantee legal compliance (only check)
✗ Cannot make business decisions
✗ Must cite standards and regulations
✗ Cannot modify code

QA GATES:
- Input: Code + config + documentation
- Output: {standards: [], gaps: [], evidence: [], references: []}
- All standards must be current versions
- Timeout: <3 seconds
- References: Official standards documents
- Tests: 8+ test cases
```

---

## Existing Agent Capabilities (PRESERVED)

### Router Agent
```
Capability: Classify failure into 6 families
Input: Incident description + optional logs
Output: {topCandidates: [{type, confidence, evidence}]}
Confidence threshold: ≥0.65
Timeout: <1 second
```

### Retriever Agent
```
Capability: Find exact evidence
Input: Classification + search hints
Output: {evidence: [{file, line, timestamp, snippet}]}
File patterns: Must match repo structure
Timeout: <2 seconds
Evidence format: REQUIRED file:line format
```

### Skeptic Agent
```
Capability: Produce alternative explanation
Input: First hypothesis + evidence
Output: {alternative: string, reasoning: [], probability: number}
Constraint: Must differ from first hypothesis
Confidence: <0.50 for alternative (if higher, first answer likely wrong)
```

### Verifier Agent
```
Capability: Validate claims
Input: All claims + evidence
Output: {rootCause, fixPlan, rollback, tests, confidence}
Confidence: 0.0 - 1.0
Minimum threshold: 0.70 for approval
All claims must cite evidence
```

### Critic Agent
```
Capability: Quality gate enforcement
Input: Complete diagnostic report
Output: {approved: boolean, issues: Array, confidence}
Checks: Evidence completeness, fix plan validity, rollback feasibility, test coverage
Minimum confidence: 0.70
Cannot approve without all components
```

---

## MCP Context Provider Capabilities

### Repo Context Provider
```
CAN:
✓ List directory contents
✓ Get file metadata (size, modification time)
✓ Search for files by pattern
✓ Get file line count
✓ Verify file existence

CANNOT:
✗ Read file contents (use file system for that)
✗ Modify files
✗ Delete files
✗ List hidden files
```

### Log Context Provider
```
CAN:
✓ Search logs by keyword
✓ Filter by timestamp range
✓ Get log line context (before/after)
✓ Extract log patterns
✓ Calculate error frequency

CANNOT:
✗ Modify logs
✗ Delete log entries
✗ Access system logs outside repo
✗ Parse arbitrary formats
```

### Schema Context Provider
```
CAN:
✓ Get field definitions
✓ Validate field types
✓ Get table/entity relationships
✓ Check field constraints
✓ List all entities

CANNOT:
✗ Modify schema
✗ Execute queries
✗ Predict performance
✗ Access runtime data
```

### Metrics Context Provider
```
CAN:
✓ Retrieve time-series data
✓ Get aggregated metrics
✓ Calculate percentiles
✓ Identify trends
✓ Find anomalies

CANNOT:
✗ Write metrics
✗ Delete metrics
✗ Predict future values
✗ Trigger alerts
```

---

## Website Display Rules

### Evidence Display
- ✓ Show file:line citations as clickable links
- ✓ Display snippet with context
- ✓ Show timestamp for log entries
- ✓ Highlight validated vs. unvalidated evidence
- ✗ NEVER show secret keys, passwords, tokens

### Pipeline Visualization
- ✓ Show flow: Router → Retriever → Skeptic → Verifier → Critic
- ✓ Display confidence scores at each step
- ✓ Show evidence accumulation
- ✓ Display timing/performance
- ✗ NEVER block or slow down the visualization

### Skill Demonstrations
- ✓ Allow interactive testing
- ✓ Show real validation results
- ✓ Display formula breakdowns
- ✓ Highlight successes and failures
- ✗ NEVER allow file modification

### Error Handling
- ✓ Display user-friendly error messages
- ✓ Suggest corrections
- ✓ Show why validation failed
- ✓ Provide example correct input
- ✗ NEVER expose internal stack traces to users

---

## Testing Requirements

### Unit Tests (Per Skill/Agent)
- Minimum 8+ test cases per component
- All happy paths covered
- All error paths covered
- Boundary conditions tested
- Timeout handling verified

### Integration Tests
- Skills work together correctly
- Agents can call skills
- MCP providers return correct data
- Website displays results correctly
- No circular dependencies

### End-to-End Tests
- Full pipeline execution
- Evidence collected and displayed
- Confidence calculated correctly
- All steps complete <5 seconds
- No data loss or corruption

### QA Gates
- 100% of new code tested
- Coverage ≥95% for critical code
- All tests pass locally before push
- CI must be green before merge
- Manual feature testing completed

---

## Version Control Rules

### Commit Rules
- Feature branch only (never main)
- Descriptive commit messages
- Atomic commits (one feature per commit)
- No secrets in commits
- No large binary files

### PR Rules
- PR description details all changes
- All tests passing (CI green)
- No merge until approved
- Rebase before merge (if main changes)
- Squash commits (if >5 commits)

### Documentation Rules
- README updated with new features
- CHANGELOG updated with version
- Inline comments for complex logic
- Examples provided for new APIs
- Breaking changes documented

---

## Approval Process

### Pre-Approval Checklist
- [ ] All 547 tests passing
- [ ] Coverage ≥90%
- [ ] Localhost demo functional
- [ ] Website interactive
- [ ] Documentation complete
- [ ] No secrets in commits
- [ ] PLAN_INTEGRATION_WEBSITE.md complete
- [ ] This file (GUARDRAILS_INTEGRATION.md) complete

### Sign-Off
- [ ] User reviews PLAN_INTEGRATION_WEBSITE.md
- [ ] User reviews GUARDRAILS_INTEGRATION.md
- [ ] User approves moving to Bucket 2 execution
- [ ] User accepts bucket progress updates (%)

---

## Metrics & Monitoring

### Success Metrics
- Tests passing: 547/547 (100%)
- Coverage: ≥90% (target 94.72%)
- Localhost response time: <500ms
- Website load time: <2s
- Feature test coverage: 100%

### Failure Metrics
- Tests failing: ZERO tolerance
- Coverage drop: Not allowed
- Localhost down: Block merge
- Website error: Block merge
- Untested features: Block merge

---

## Notes for Future Reference

This document defines EXACTLY what can be done with 100% confidence during the integration website PR. No guessing, no assumptions — every capability is tested, every guardrail is enforced.

If mistakes happen, tighten guardrails immediately. If same issue occurs twice, prevent it with automation (pre-commit hook, validator, etc.).

