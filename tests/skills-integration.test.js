/**
 * Skills Integration Tests
 *
 * Tests for evidence-verifier, hallucination-detector, confidence-scorer,
 * and their integration into the orchestrator-client.
 */

import { jest } from '@jest/globals';
import { EvidenceVerifier } from '../src/skills/evidence-verifier.js';
import { HallucinationDetector } from '../src/skills/hallucination-detector.js';
import { ConfidenceScorer } from '../src/skills/confidence-scorer.js';
import { DebugOrchestrator } from '../src/orchestrator/orchestrator-client.js';

// ─── EvidenceVerifier Unit Tests ───────────────────────────────────────────────

describe('EvidenceVerifier', () => {
  let verifier;

  beforeEach(() => {
    verifier = new EvidenceVerifier({ repoRoot: process.cwd() });
  });

  test('should validate well-formed claims', () => {
    const claims = [
      { text: 'Connection pool exhausted', citation: 'package.json:1', timestamp: '2026-03-09T10:00:00Z' }
    ];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(true);
    expect(report.totalClaims).toBe(1);
    expect(report.issues).toHaveLength(0);
  });

  test('should flag missing citation', () => {
    const claims = [{ text: 'Some claim' }];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ field: 'citation', message: 'Citation is missing' })
    );
  });

  test('should flag invalid citation format', () => {
    const claims = [{ text: 'Claim', citation: 'no-line-number' }];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(false);
    expect(report.issues[0].message).toMatch(/does not match file:line format/);
  });

  test('should flag non-existent file in citation', () => {
    const claims = [{ text: 'Claim', citation: 'nonexistent/file.js:42' }];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('does not exist') })
    );
  });

  test('should flag invalid timestamp format', () => {
    const claims = [{ text: 'Claim', citation: 'package.json:1', timestamp: 'not-a-date' }];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(false);
    expect(report.issues[0].field).toBe('timestamp');
  });

  test('should accept date-only timestamps', () => {
    const claims = [{ text: 'Claim', citation: 'package.json:1', timestamp: '2026-03-09' }];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(true);
  });

  test('should flag empty claim text', () => {
    const claims = [{ text: '', citation: 'package.json:1' }];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(false);
    expect(report.issues[0].field).toBe('text');
  });

  test('should flag null claims in array', () => {
    const claims = [null];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(false);
    expect(report.issues[0].field).toBe('claim');
  });

  test('should throw for non-array input', () => {
    expect(() => verifier.verify('not-array')).toThrow('Claims must be an array');
  });

  test('should validate multiple claims independently', () => {
    const claims = [
      { text: 'Good claim', citation: 'package.json:1' },
      { text: 'Bad claim', citation: 'missing.js:1' }
    ];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(false);
    expect(report.totalClaims).toBe(2);
    expect(report.issues).toHaveLength(1);
    expect(report.issues[0].claimIndex).toBe(1);
  });

  test('should flag line number less than 1', () => {
    const claims = [{ text: 'Claim', citation: 'package.json:0' }];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(false);
    expect(report.issues[0].message).toMatch(/Line number must be >= 1/);
  });

  test('should handle empty claims array', () => {
    const report = verifier.verify([]);
    expect(report.valid).toBe(true);
    expect(report.totalClaims).toBe(0);
  });

  test('should handle claims without timestamp (optional field)', () => {
    const claims = [{ text: 'Valid claim', citation: 'package.json:1' }];
    const report = verifier.verify(claims);
    expect(report.valid).toBe(true);
  });
});

// ─── HallucinationDetector Unit Tests ──────────────────────────────────────────

describe('HallucinationDetector', () => {
  let detector;
  const schema = {
    user: {
      fields: ['id', 'email', 'name'],
      types: { id: 'number', email: 'string', name: 'string' }
    },
    order: {
      fields: ['id', 'total', 'status'],
      types: { id: 'number', total: 'number', status: 'string' }
    }
  };

  beforeEach(() => {
    detector = new HallucinationDetector({
      repoRoot: process.cwd(),
      schema,
      knownAPIs: ['GET /api/users', 'POST /api/orders', 'GET /api/orders/*']
    });
  });

  test('should return zero risk for valid claims', () => {
    const claims = [{ text: 'User email is valid', referencedField: 'user.email' }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBe(0);
    expect(report.flaggedClaims).toBe(0);
  });

  test('should flag unknown entity', () => {
    const claims = [{ text: 'Invoice total', referencedField: 'invoice.total' }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBeGreaterThan(0);
    expect(report.details[0].type).toBe('unknown_entity');
  });

  test('should flag unknown field on known entity', () => {
    const claims = [{ text: 'User phone', referencedField: 'user.phone' }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBeGreaterThan(0);
    expect(report.details[0].type).toBe('unknown_field');
  });

  test('should flag unknown API endpoint', () => {
    const claims = [{ text: 'Delete user', referencedAPI: 'DELETE /api/users' }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBeGreaterThan(0);
    expect(report.details[0].type).toBe('unknown_api');
  });

  test('should match wildcard API patterns', () => {
    const claims = [{ text: 'Get order', referencedAPI: 'GET /api/orders/123' }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBe(0);
  });

  test('should flag missing function in file', () => {
    const claims = [{
      text: 'Calls nonExistentFn',
      functionSignature: { file: 'package.json', name: 'nonExistentFn' }
    }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBeGreaterThan(0);
    expect(report.details[0].type).toBe('missing_function');
  });

  test('should detect function in existing file', () => {
    const claims = [{
      text: 'Uses verify method',
      functionSignature: { file: 'src/skills/evidence-verifier.js', name: 'verify' }
    }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBe(0);
  });

  test('should flag missing file in function signature', () => {
    const claims = [{
      text: 'Bad file ref',
      functionSignature: { file: 'nonexistent.js', name: 'foo' }
    }];
    const report = detector.detect(claims);
    expect(report.details[0].type).toBe('missing_file');
  });

  test('should flag incomplete function signature', () => {
    const claims = [{
      text: 'Missing name',
      functionSignature: { file: 'package.json' }
    }];
    const report = detector.detect(claims);
    expect(report.details[0].type).toBe('invalid_signature');
  });

  test('should flag type mismatch', () => {
    const claims = [{
      text: 'User ID is string',
      dataType: { field: 'user.id', expectedType: 'string' }
    }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBeGreaterThan(0);
    expect(report.details[0].type).toBe('type_mismatch');
  });

  test('should accept correct data type', () => {
    const claims = [{
      text: 'User ID is number',
      dataType: { field: 'user.id', expectedType: 'number' }
    }];
    const report = detector.detect(claims);
    expect(report.riskScore).toBe(0);
  });

  test('should handle empty claims array', () => {
    const report = detector.detect([]);
    expect(report.riskScore).toBe(0);
    expect(report.totalClaims).toBe(0);
  });

  test('should throw for non-array input', () => {
    expect(() => detector.detect('bad')).toThrow('Claims must be an array');
  });

  test('should flag invalid claim objects', () => {
    const report = detector.detect([null, 42]);
    expect(report.flaggedClaims).toBe(2);
  });

  test('should skip API validation when no knownAPIs provided', () => {
    const bare = new HallucinationDetector({ repoRoot: process.cwd() });
    const claims = [{ text: 'Any API', referencedAPI: 'DELETE /unknown' }];
    const report = bare.detect(claims);
    expect(report.riskScore).toBe(0);
  });

  test('should skip field validation when no schema provided', () => {
    const bare = new HallucinationDetector({ repoRoot: process.cwd() });
    const claims = [{ text: 'Any field', referencedField: 'ghost.field' }];
    const report = bare.detect(claims);
    expect(report.riskScore).toBe(0);
  });

  test('should flag field without entity prefix', () => {
    const claims = [{ text: 'Bad field', referencedField: 'noprefix' }];
    const report = detector.detect(claims);
    expect(report.details[0].type).toBe('unknown_field');
  });

  test('should handle data type claim missing required fields', () => {
    const claims = [{ text: 'Bad type', dataType: { field: 'user.id' } }];
    const report = detector.detect(claims);
    expect(report.details[0].type).toBe('invalid_type_claim');
  });

  test('should compute risk score correctly', () => {
    const claims = [
      { text: 'Good', referencedField: 'user.email' },
      { text: 'Bad', referencedField: 'ghost.field' },
      { text: 'Also bad', referencedField: 'user.nonexistent' }
    ];
    const report = detector.detect(claims);
    // 2 out of 3 flagged => riskScore = 0.67
    expect(report.riskScore).toBeCloseTo(0.67, 1);
    expect(report.flaggedClaims).toBe(2);
  });
});

// ─── ConfidenceScorer Unit Tests ───────────────────────────────────────────────

describe('ConfidenceScorer', () => {
  let scorer;

  beforeEach(() => {
    scorer = new ConfidenceScorer({ repoRoot: process.cwd() });
  });

  test('should compute confidence with valid claims', () => {
    const result = scorer.score({
      baseScore: 0.7,
      claims: [
        { text: 'Valid claim', citation: 'package.json:1' }
      ]
    });
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.evidenceBonus).toBeGreaterThan(0);
    expect(result.breakdown).toBeDefined();
  });

  test('should reduce confidence for bad evidence', () => {
    const good = scorer.score({
      baseScore: 0.7,
      claims: [{ text: 'Good', citation: 'package.json:1' }]
    });
    const bad = scorer.score({
      baseScore: 0.7,
      claims: [{ text: 'Bad', citation: 'nonexistent.js:1' }]
    });
    // Bad evidence should not get the full evidence bonus
    expect(bad.confidence).toBeLessThanOrEqual(good.confidence);
  });

  test('should penalize unresolved contradictions', () => {
    const noContradictions = scorer.score({
      baseScore: 0.7,
      claims: [{ text: 'Claim', citation: 'package.json:1' }],
      contradictions: []
    });
    const withContradictions = scorer.score({
      baseScore: 0.7,
      claims: [{ text: 'Claim', citation: 'package.json:1' }],
      contradictions: [{ description: 'Alternative theory', resolved: false }]
    });
    expect(withContradictions.confidence).toBeLessThan(noContradictions.confidence);
    expect(withContradictions.contradictionPenalty).toBeGreaterThan(0);
  });

  test('should not penalize resolved contradictions', () => {
    const result = scorer.score({
      baseScore: 0.7,
      claims: [{ text: 'Claim', citation: 'package.json:1' }],
      contradictions: [{ description: 'Resolved theory', resolved: true }]
    });
    expect(result.contradictionPenalty).toBe(0);
  });

  test('should clamp confidence between 0 and 1', () => {
    const high = scorer.score({ baseScore: 1.5, claims: [] });
    expect(high.confidence).toBeLessThanOrEqual(1);

    const low = scorer.score({ baseScore: -0.5, claims: [] });
    expect(low.confidence).toBeGreaterThanOrEqual(0);
  });

  test('should throw for non-object input', () => {
    expect(() => scorer.score(null)).toThrow('Input must be a valid object');
  });

  test('should handle empty claims', () => {
    const result = scorer.score({ baseScore: 0.7, claims: [] });
    expect(result.evidenceBonus).toBe(0);
    expect(result.confidence).toBeDefined();
  });

  test('should default baseScore to 0.5', () => {
    const result = scorer.score({ claims: [] });
    expect(result.baseScore).toBe(0.5);
  });

  test('should include sub-reports', () => {
    const result = scorer.score({
      baseScore: 0.7,
      claims: [{ text: 'Claim', citation: 'package.json:1' }]
    });
    expect(result.evidenceReport).toBeDefined();
    expect(result.hallucinationReport).toBeDefined();
    expect(result.evidenceReport.totalClaims).toBe(1);
  });

  test('should achieve 0.85+ confidence with strong evidence and no hallucinations', () => {
    const result = scorer.score({
      baseScore: 0.75,
      claims: [
        { text: 'DB pool exhausted at line 1', citation: 'package.json:1' },
        { text: 'Error handler at line 2', citation: 'package.json:2' }
      ],
      contradictions: []
    });
    // baseScore 0.75 + evidenceBonus 0.25 = 1.0 (capped), no penalties
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });
});

// ─── Orchestrator Skills Integration ───────────────────────────────────────────

describe('DebugOrchestrator: Skills Integration', () => {
  let orchestrator;

  beforeEach(async () => {
    orchestrator = new DebugOrchestrator({ repoRoot: process.cwd() });
    await orchestrator.initialize();
  });

  test('should have skills modules initialized', () => {
    expect(orchestrator.evidenceVerifier).toBeDefined();
    expect(orchestrator.hallucinationDetector).toBeDefined();
    expect(orchestrator.confidenceScorer).toBeDefined();
  });

  test('should report 11 modules after skills integration', async () => {
    const newOrch = new DebugOrchestrator();
    const result = await newOrch.initialize();
    expect(result.modules).toBe(11);
  });

  test('verifyEvidence delegates to EvidenceVerifier', () => {
    const claims = [{ text: 'Claim', citation: 'package.json:1' }];
    const report = orchestrator.verifyEvidence(claims);
    expect(report.valid).toBe(true);
    expect(report.totalClaims).toBe(1);
  });

  test('detectHallucinations delegates to HallucinationDetector', () => {
    const claims = [{ text: 'Simple claim' }];
    const report = orchestrator.detectHallucinations(claims);
    expect(report.riskScore).toBeDefined();
    expect(report.totalClaims).toBe(1);
  });

  test('scoreConfidence delegates to ConfidenceScorer', () => {
    const result = orchestrator.scoreConfidence({
      baseScore: 0.7,
      claims: [{ text: 'Claim', citation: 'package.json:1' }]
    });
    expect(result.confidence).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('validateDiagnostic passes for good diagnostics', () => {
    const result = orchestrator.validateDiagnostic({
      baseScore: 0.8,
      claims: [
        { text: 'Valid evidence', citation: 'package.json:1' }
      ],
      contradictions: []
    });
    expect(result.passed).toBe(true);
    expect(result.hallucinationBlocked).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  test('validateDiagnostic blocks high hallucination risk', () => {
    const orch = new DebugOrchestrator({
      repoRoot: process.cwd(),
      schema: { user: { fields: ['id'] } },
      knownAPIs: ['GET /api/users']
    });

    const result = orch.validateDiagnostic({
      baseScore: 0.8,
      claims: [
        { text: 'Bad field ref', referencedField: 'ghost.entity', citation: 'package.json:1' },
        { text: 'Bad API ref', referencedAPI: 'DELETE /api/unknown', citation: 'package.json:1' }
      ]
    });
    expect(result.hallucinationBlocked).toBe(true);
    expect(result.passed).toBe(false);
  });

  test('validateDiagnostic returns all sub-reports', () => {
    const result = orchestrator.validateDiagnostic({
      baseScore: 0.7,
      claims: [{ text: 'Claim', citation: 'package.json:1' }]
    });
    expect(result.evidenceReport).toBeDefined();
    expect(result.hallucinationReport).toBeDefined();
    expect(result.scoringResult).toBeDefined();
    expect(typeof result.confidence).toBe('number');
  });

  test('full pipeline: submit task then validate diagnostic', async () => {
    const task = { type: 'debug', evidence: [], hypothesis: 'connection pool' };
    const submitResult = await orchestrator.submitTask(task);
    expect(submitResult.success).toBe(true);

    // Simulate diagnostic output for the task
    const validation = orchestrator.validateDiagnostic({
      baseScore: 0.75,
      claims: [
        { text: 'Pool limit reached', citation: 'package.json:1' },
        { text: 'Error spike at timestamp', citation: 'package.json:2', timestamp: '2026-03-09T10:00:00Z' }
      ],
      contradictions: [{ description: 'Memory leak theory', resolved: true }]
    });

    expect(validation.passed).toBe(true);
    expect(validation.confidence).toBeGreaterThanOrEqual(0.85);
  });

  test('confidence improvement: 0.70 baseline boosted to 0.85+', () => {
    // Simulate the target scenario: base confidence of 0.70
    // with strong evidence should boost to 0.85+
    const result = orchestrator.scoreConfidence({
      baseScore: 0.70,
      claims: [
        { text: 'Claim 1', citation: 'package.json:1' },
        { text: 'Claim 2', citation: 'package.json:2' },
        { text: 'Claim 3', citation: 'package.json:3' }
      ],
      contradictions: []
    });
    // 0.70 + 0.25 (evidence bonus for all valid) = 0.95
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });
});
