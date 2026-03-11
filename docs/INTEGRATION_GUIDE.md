# CodeReview-Pilot Integration Guide

**Table of Contents**
1. [What is CodeReview-Pilot](#what-is-codereview-pilot)
2. [The 5-Agent Pipeline](#the-5-agent-pipeline)
3. [Using the Interactive Website](#using-the-interactive-website)
4. [Step-by-Step Examples](#step-by-step-examples)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## What is CodeReview-Pilot

CodeReview-Pilot is an evidence-first diagnostic system designed for backend engineers and SREs to diagnose production incidents with rigorous, verifiable explanations. Unlike traditional AI debugging tools that prioritize confidence, CodeReview-Pilot enforces a strict methodology where all claims must be backed by concrete evidence retrieved from logs, code, schemas, and metrics.

### Core Philosophy

The tool follows this workflow instead of the traditional "question → answer" pattern:

```
Traditional:     Question → Confident but often wrong answer
CodeReview-Pilot: Question → Retrieve Evidence → Challenge → Verify → Explain
```

### Key Characteristics

- **Evidence-First**: Every claim must cite specific file:line numbers, log timestamps, or schema definitions
- **Self-Challenging**: A dedicated agent (Skeptic) generates competing explanations to pressure-test the initial diagnosis
- **Verification Gate**: The Verifier agent blocks any output lacking confidence >= 0.70 and supporting evidence
- **Rollback Planning**: Every fix includes a concrete rollback strategy
- **Test Coverage**: Diagnoses include test cases for validation

### Output Contract

Every diagnosis follows this contract:

```json
{
  "root_cause": "string (required, backed by evidence)",
  "evidence": [
    "src/database.js:42 - connection pool size set to 50",
    "logs/error.log 2024-03-09T15:30:00Z - Pool exhausted",
    "config/prod.yaml:18 - max_connections: 50"
  ],
  "fix_plan": "Increase pool size from 50 to 150 in config/prod.yaml:18",
  "rollback_plan": "Revert config/prod.yaml to previous commit, restart service",
  "tests": [
    "Load test with 200 concurrent connections",
    "Verify pool metrics in Prometheus",
    "Check error rate drops below 1%"
  ],
  "confidence": 0.92
}
```

---

## The 5-Agent Pipeline

CodeReview-Pilot uses a specialized five-agent pipeline, each with a specific responsibility. Understanding this pipeline is crucial for using the tool effectively.

### 1. Router Agent

**Role**: Classifies the failure type and routes to relevant evidence sources.

**Responsibilities**:
- Analyze incident description
- Classify into one of six failure families:
  - `schema_drift` - Database schema mismatch
  - `write_conflict` - Race condition or concurrent write
  - `stale_read` - Caching or eventual consistency issue
  - `bad_deploy` - New deployment introduced bug
  - `auth_failure` - Authentication or permission issue
  - `dependency_break` - External service failure

**Example**:
```
Input: "API returning 503s, 50% error rate, started at 2:45 UTC"
Classification: likely `dependency_break` or `resource_exhaustion`
Routes to: schema inspection, recent deploys, dependency metrics
```

### 2. Retriever Agent

**Role**: Pulls exact, citable evidence from the codebase.

**Responsibilities**:
- Query code repositories with file:line precision
- Extract database schema definitions
- Retrieve log snippets with timestamps
- Pull deployment records and change history
- Fetch metric baselines and anomalies

**Evidence Sources**:
- `src/` - Code implementation
- `schema/` - Database definitions
- `logs/` - Application and system logs
- `config/` - Environment configurations
- `incidents/` - Historical incident records

**Example**:
```
Query: "When was the database connection pool last modified?"
Result:
  - src/database.js:42 (modified 2024-03-08)
  - Pool size: 50 (line 42)
  - Last deploy: v2.3.1 (2024-03-08 14:30)
  - Pool exhaustion events in logs: 3 since 15:20 UTC
```

### 3. Skeptic Agent

**Role**: Challenges the initial diagnosis with a materially different theory.

**Responsibilities**:
- Generate competing explanation from different failure family
- Pressure-test the primary hypothesis
- Identify assumptions in the first diagnosis
- Suggest alternative evidence sources

**Example**:
```
Primary diagnosis: "Pool exhaustion due to connection leak"
Skeptic's theory: "Authentication module rejects 80% of requests,
                   causing retry storm that exhausts pool"
Evidence needed: auth logs, retry counts, request timing
```

### 4. Verifier Agent

**Role**: Validates that all claims are backed by evidence.

**Responsibilities**:
- Block unsupported assertions (nouns that weren't retrieved)
- Ensure every claim has a citation (file:line, timestamp, or metric)
- Verify fix plan is implementable and rollback is safe
- Enforce confidence threshold (>= 0.70)
- Check test plan covers root cause

**Blocking Rules**:
- Cannot mention a file not retrieved from disk
- Cannot claim a field exists without showing schema
- Cannot suggest a fix without showing the code location
- Cannot give confidence > 0.85 without 3+ independent evidence sources

### 5. Critic Agent

**Role**: Quality gate for the entire pipeline output.

**Responsibilities**:
- Validate confidence score is justified (not overconfident)
- Check that rollback plan is detailed and safe
- Ensure test cases are specific and measurable
- Verify all citations resolve to actual files/lines
- Approve or reject for human review

---

## Using the Interactive Website

CodeReview-Pilot provides an interactive web interface for diagnosing incidents.

### Starting the Server

```bash
# Install dependencies
npm install

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Start the interactive server
npm start
# or
node src/demo-server.js

# Server runs on http://localhost:3000
```

### Website Layout

The interactive website consists of four main sections:

#### 1. Incident Input Panel

**Purpose**: Provide incident details for diagnosis.

**Fields**:
- **Description** (text area) - Free-form incident description
- **Time Range** (date/time) - When did the incident start/end
- **Error Rate** (percentage) - Failure rate if known
- **Affected Service** (dropdown) - Which service is failing
- **Log Source** (file picker) - Upload recent logs if available

**Tips**:
- Be specific: "API returns 503 errors" is better than "Something is wrong"
- Include timestamps: "Starting 2024-03-09 15:30 UTC"
- Mention error rate/impact: "50% of requests fail"
- Include any recent changes: "Deployed v2.3.1 at 14:30"

#### 2. Agent Progress Monitor

**Purpose**: Track pipeline execution in real-time.

**Displays**:
- Current agent (Router → Retriever → Skeptic → Verifier → Critic)
- Evidence retrieved so far
- Confidence score (updating as diagnosis progresses)
- Time elapsed per agent

**States**:
- 🔄 Running - Agent is actively diagnosing
- ✓ Complete - Agent finished, see results
- ⚠️ Blocked - Evidence missing, need more data

#### 3. Evidence Panel

**Purpose**: View all retrieved evidence with citations.

**Shows**:
- Files accessed (with line numbers)
- Log snippets (with timestamps)
- Schema definitions (with field types)
- Metrics and thresholds
- Recent deployments

**Each evidence item shows**:
- Source (file path or log name)
- Context (surrounding lines or full metric)
- Timestamp (when relevant)
- Relevance (how this supports diagnosis)

#### 4. Output Panel

**Purpose**: View the final diagnostic report.

**Contains**:
- **Root Cause** - The specific failure, backed by evidence
- **Fix Plan** - Exact code change with file:line location
- **Rollback Plan** - Step-by-step reversal procedure
- **Tests** - Specific test cases to validate fix
- **Confidence** - Numeric confidence score with justification

---

## Step-by-Step Examples

### Example 1: Database Connection Pool Exhaustion

**Scenario**: Production API returns 503 errors starting at 15:30 UTC, 50% error rate.

#### Step 1: Submit Incident

```
Description: "API endpoints timing out, returning 503 errors.
             Error rate jumped from <1% to 50% at 2024-03-09 15:30 UTC.
             Deployed v2.3.1 at 14:30 UTC today."

Time Range: 2024-03-09 15:30 to 16:00

Error Rate: 50%

Affected Service: API Gateway
```

#### Step 2: Router Classifies

The Router analyzes the incident and classifies it:

```
Classification: dependency_break or resource_exhaustion
Evidence sources needed:
  - Recent deployments (v2.3.1)
  - Database configuration
  - Connection pool metrics
  - Application logs 15:30-15:45
```

#### Step 3: Retriever Pulls Evidence

Retriever accesses:

```
src/database.js:42
  const pool = mysql.createPool({
    connectionLimit: 50,  // <-- Potentially the issue
    waitForConnections: true,
    queueLimit: 10
  });

config/prod.yaml:18
  database:
    max_connections: 50
    query_timeout: 5000

logs/api.log around 15:30
  2024-03-09T15:30:12Z [ERROR] Pool exhausted: waiting for available connection
  2024-03-09T15:30:45Z [ERROR] Pool exhausted: 200 requests queued
  2024-03-09T15:31:20Z [ERROR] Pool still exhausted: queue limit exceeded

DEPLOYMENTS
  v2.3.1 (deployed 2024-03-09 14:30:00)
    - Added new user analytics feature
    - Uses database queries on every request
    - No connection pooling optimization
```

#### Step 4: Skeptic Challenges

Skeptic generates alternative hypothesis:

```
Alternative Theory: "The analytics feature is correct, but there's a
connection leak in the cleanup handler. Connections aren't being returned
to the pool."

Evidence needed:
  - Check analytics code for connection release
  - Monitor pool.getConnection() vs connection.release() calls
  - Check for unhandled promise rejections
```

#### Step 5: Verifier Validates

Verifier checks all claims:

```
✓ Pool size is 50 (cited: src/database.js:42)
✓ v2.3.1 deployed at 14:30 (cited: DEPLOYMENTS)
✓ Error rate jumped at 15:30 (cited: logs/api.log timestamps)
✓ New analytics feature added (cited: v2.3.1 release notes)

Confidence: 0.92
Justification: Three independent evidence sources (code, config, logs)
              all point to connection pool exhaustion as root cause.
              Timing (deployment at 14:30, errors at 15:30) correlates.
```

#### Step 6: Final Output

```json
{
  "root_cause": "Database connection pool size (50) is insufficient for
                the new analytics feature added in v2.3.1. Each user
                request now requires multiple database queries for analytics,
                exhausting the pool within 60 minutes of deployment.",

  "evidence": [
    "src/database.js:42 - Pool size limited to 50 connections",
    "v2.3.1 release notes - New analytics feature queries DB on every request",
    "logs/api.log 15:30 - First pool exhaustion error",
    "logs/api.log 15:31 - Queue limit exceeded",
    "config/prod.yaml:18 - max_connections: 50"
  ],

  "fix_plan": "Increase connection pool size to 150 and add connection pooling
             optimization for analytics queries. Change in src/database.js:42
             from 'connectionLimit: 50' to 'connectionLimit: 150'. Also add
             query caching in src/analytics.js to reduce database hits.",

  "rollback_plan": "1. Revert config/prod.yaml line 18 back to max_connections: 50
                  2. Redeploy v2.3.0 (last stable release)
                  3. Monitor pool metrics for 5 minutes
                  4. If stable, no further action needed",

  "tests": [
    "Load test: 200 concurrent users, verify pool utilization < 80%",
    "Analytics feature: verify results match cached queries",
    "Monitor Prometheus: pool_size_current stays < 100 for 30 minutes",
    "Error rate should drop below 1%"
  ],

  "confidence": 0.92
}
```

---

### Example 2: Schema Drift After Migration

**Scenario**: Mobile app crashes when receiving user profiles, started after deployment.

#### Incident Details

```
Description: "iOS app crashing when parsing user profile response.
             Desktop web works fine. Error: 'missing field age_in_years'.
             Deployment v3.1.0 includes database migration."

Time Range: 2024-03-09 16:45 to current

Error Rate: 75% of mobile app users

Affected Service: User Profile API
```

#### Router Classification

```
Classification: schema_drift
Routes to:
  - Database schema (before/after migration)
  - API response handler code
  - Mobile app model definitions
  - API changelog
```

#### Evidence Retrieved

```
OLD SCHEMA (v3.0.9):
  CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    age INT,
    FOREIGN KEY (age) ...
  );

NEW SCHEMA (v3.1.0):
  CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    age_in_years INT,  -- <-- RENAMED!
    FOREIGN KEY (age_in_years) ...
  );

API Response Handler (src/handlers/user.js:28):
  async function getProfile(userId) {
    const user = await db.query('SELECT id, name, age_in_years FROM users');
    return { id: user.id, name: user.name, age: user.age_in_years };
  }

Mobile App Model (ios/Models/User.swift):
  struct User: Codable {
    let id: Int
    let name: String
    let age: Int  // <-- Expects 'age', not 'age_in_years'
  }

DEPLOYMENT LOG:
  v3.1.0 deployed 2024-03-09 16:30 UTC
  Schema migration completed
  API handler updated
  Mobile app NOT updated (releases v3.0 still in production)
```

#### Skeptic's Challenge

```
Theory: "The API response actually includes 'age' field, but there's a
serialization issue in the iOS SDK causing parsing to fail."

Evidence needed: Inspect raw API response body and compare to mobile parser.
```

#### Verifier Validation

```
✓ Schema renamed field from 'age' to 'age_in_years' (schema diff v3.0→v3.1)
✓ API handler updated (src/handlers/user.js:28)
✓ Mobile app still expects 'age' (ios/Models/User.swift)
✓ Deployment timestamp: 16:30, errors start: 16:45 (15 min lag for cache invalidation)

Problem: API returns age_in_years, but iOS app (v3.0) expects age
iOS app is unaware of schema change because it wasn't deployed with v3.1.0

Confidence: 0.95
```

#### Final Diagnosis

```json
{
  "root_cause": "Schema migration in v3.1.0 renamed 'age' field to
                'age_in_years', but mobile app v3.0 (still in production)
                expects the old field name. API response is missing the
                'age' field that iOS client requires.",

  "evidence": [
    "schema/migrations/v3.1.0.sql - Renamed age to age_in_years",
    "src/handlers/user.js:28 - Returns age_in_years",
    "ios/Models/User.swift - Decodes age field",
    "Deployment log: v3.1.0 at 16:30, errors at 16:45",
    "iOS version in production: 3.0 (not updated)"
  ],

  "fix_plan": "Option 1 (Quick): Add backward-compatible field in API response.
             In src/handlers/user.js:28, change response to include both:
             { id, name, age: user.age_in_years, age_in_years }.

             Option 2 (Long-term): Deploy new iOS app version 3.1 that
             expects age_in_years field.",

  "rollback_plan": "1. Deploy patch v3.1.1 with backward-compatible response
                  2. Include both 'age' and 'age_in_years' in response
                  3. Mobile app v3.0 will work with 'age' field
                  4. Test with iOS 3.0, 3.1 running simultaneously
                  5. Once 99% of users upgrade to iOS 3.1, remove 'age' field",

  "tests": [
    "Call API with test user ID, verify response includes both 'age' and 'age_in_years'",
    "Mobile app v3.0 can parse response without errors",
    "Mobile app v3.1 can parse response without errors",
    "Error rate drops from 75% to <1%"
  ],

  "confidence": 0.95
}
```

---

## Troubleshooting

### Agent Gets Stuck (No Progress)

**Symptom**: Pipeline hangs at one agent, no activity for > 1 minute.

**Diagnosis**:
```bash
# Check logs for blocked evidence
tail -f logs/pipeline.log

# Look for "Evidence not found" messages
grep "NOT_FOUND" logs/pipeline.log
```

**Solutions**:

1. **Missing Evidence**: Provide additional context
   - Upload relevant log files
   - Specify exact service/component name
   - Include version numbers

2. **Ambiguous Classification**: Router unsure of failure type
   - Be more specific: "Database error" → "ERROR: Duplicate key constraint violation"
   - Include error messages from logs
   - Mention recent changes

### Low Confidence Score (< 0.70)

**Symptom**: Diagnosis blocked with "confidence too low" error.

**Causes**:
- Insufficient evidence retrieved
- Competing theories equally plausible
- Time range doesn't capture root cause

**Resolution**:
1. Check Evidence Panel - what's missing?
2. Expand time range to capture before/after incident
3. Provide additional context:
   - Recent code changes
   - Infrastructure changes
   - Traffic pattern changes

### "Unsupported Noun" Error

**Symptom**: Verifier rejects explanation with "file not found" or "field doesn't exist".

**Example**:
```
ERROR: Cannot claim field "user_role" exists in users table
       (not found in schema/database.sql)
```

**Resolution**:
1. Check schema definitions match your actual database
2. Verify field names are correct (check case sensitivity)
3. If field is new, include migration file that created it
4. Update schema documentation if out of sync

### Skeptic Theory Rejected

**Symptom**: Skeptic generates alternative theory, but Verifier immediately rejects it.

**Meaning**: The alternative theory lacks supporting evidence. This is actually correct behavior - it means the primary diagnosis is more rigorous.

**Action**: Review the primary diagnosis - it should be more confident.

---

## FAQ

### Q: How accurate is CodeReview-Pilot?

**A**: Accuracy depends entirely on evidence quality. The system is designed to **never be confidently wrong** - if evidence is insufficient, confidence stays below 0.70 and diagnosis is rejected.

In the field:
- With complete evidence: 90-95% accuracy
- With partial evidence: 70-80% accuracy
- With sparse evidence: Diagnosis rejected (confidence < 0.70)

The tool prioritizes **correctness over speed**.

### Q: Can I use this for frontend debugging?

**A**: Not currently optimized for frontend issues. The pipeline is built for backend/infrastructure failures:
- Database issues
- API/service failures
- Deployment problems
- Authentication failures
- Resource exhaustion

Frontend issues (UI crashes, JavaScript errors) don't have the same evidence trail of logs, schema, and configs.

### Q: What if the root cause is ambiguous?

**A**: If Skeptic's alternative theory is equally supported by evidence, the diagnosis is marked with lower confidence (usually 0.60-0.70). You'll see both theories presented, and the fix plan covers both possibilities.

This is the tool working correctly - it's telling you "the evidence isn't conclusive yet."

### Q: How do I add my own evidence sources?

**A**: See the MCP integration docs and custom skills section:
- Create a custom context provider (see `src/mcp/context-providers/`)
- Register it in the Retriever agent
- Evidence sources are scanned on every diagnosis

### Q: Can I trust the rollback plan?

**A**: Always test rollback plans in a staging environment first. The tool generates specific, step-by-step rollback procedures, but:
- Verify all file paths are correct in your environment
- Check that dependencies are compatible with the rolled-back version
- Test the rollback procedure before it's needed in production

### Q: What if I disagree with the diagnosis?

**A**: The tool requires you to approve the fix plan before any changes are made. Follow this process:

1. Review the evidence - is it correct?
2. Review the root cause - does it match your symptoms?
3. If diagnosis seems wrong, provide contradicting evidence:
   - "The pool wasn't actually exhausted" - show pool metrics
   - "The code change doesn't affect this path" - provide call stack
4. Re-run diagnosis with updated evidence

### Q: How long do diagnoses typically take?

**A**: Depends on evidence complexity:
- Simple incidents (bad deploy): 20-40 seconds
- Complex incidents (race condition): 60-120 seconds
- Very complex (multi-system interaction): 2-5 minutes

Time is spent retrieving evidence, not generating explanations. More evidence = more time, but higher confidence.

### Q: Can I integrate this into my incident response process?

**A**: Yes. Common patterns:

```bash
# PagerDuty → incident description → CodeReview-Pilot
incident=$(curl -s https://pagerduty.api/incidents/${ID})
description=$(echo $incident | jq -r '.incident.body')
echo "$description" | curl -X POST http://localhost:3000/diagnose

# Slack bot integration
/debug "API timeout, started 15:30 UTC" → runs diagnosis → posts results

# CI/CD integration
On deployment failure, run diagnosis to determine if code or config
```

See INTEGRATION_GUIDE.md for examples.

### Q: What's the difference between Skeptic and Verifier?

**Skeptic**: Attacks the *plausibility* of the primary diagnosis by generating a competing explanation.

**Verifier**: Attacks the *evidence* of all explanations - ensuring every claim is cited.

Both are adversarial, but in different ways:
- Skeptic: "Your diagnosis might be wrong - here's another theory"
- Verifier: "Your diagnosis might sound good, but where's your proof?"

### Q: How do I improve diagnosis confidence?

**A**: Provide more evidence:

1. **Log files**: Include app logs, system logs, database logs from incident window
2. **Metrics**: CPU, memory, database connections, request latency
3. **Context**: Recent code changes, deployments, infrastructure changes
4. **Timeline**: Exact timestamps for when things started/stopped
5. **Impact**: How many users affected, what errors they see
6. **Configuration**: Current config values, limits, thresholds

More specific evidence → higher confidence.

### Q: Is there a rate limit?

**A**: Each diagnosis calls the Claude API. Standard rate limits apply based on your API key. Typical:
- Free tier: 5 diagnoses/minute
- Pro tier: 50 diagnoses/minute

---

## Next Steps

- **Read the API docs**: See [API.md](../API.md) for integration examples
- **Explore custom skills**: See [CUSTOM_SKILLS_API.md](./CUSTOM_SKILLS_API.md)
- **Create custom agents**: See [CUSTOM_AGENTS_API.md](./CUSTOM_AGENTS_API.md)
- **Review testing guide**: See [../TESTING_GUIDE.md](../TESTING_GUIDE.md)

For questions or issues, see the [main README](../README.md).
