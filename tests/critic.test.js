/**
 * Critic Agent Tests
 *
 * Validates all 5 quality gates: confidence, evidence, fix plan, rollback, tests.
 */

import { CriticAgent } from '../src/agents/critic.js';

describe('CriticAgent: Quality Gate Validation', () => {
  let critic;

  beforeEach(() => {
    critic = new CriticAgent();
  });

  // --- Valid report (all gates pass) ---

  const validReport = {
    root_cause: 'Connection pool exhaustion due to unclosed connections',
    evidence: ['src/db/pool.js:42', 'logs/api.log:158'],
    fix_plan: 'Increase DEFAULT_POOL_SIZE from 10 to 50 in src/db/pool.js:42',
    rollback: 'Revert DEFAULT_POOL_SIZE from 50 back to 10 in src/db/pool.js:42',
    tests: ['Verify pool accepts 50 concurrent connections', 'Load test with 60 requests'],
    confidence: 0.85,
  };

  test('should approve a fully valid report', () => {
    const result = critic.validate(validReport);
    expect(result.approved).toBe(true);
    expect(result.passedCount).toBe(5);
    expect(result.totalGates).toBe(5);
    expect(result.enhancedConfidence).toBe(1.0);
    expect(result.summary).toBe('All quality gates passed');
  });

  // --- Input validation ---

  test('should block null input', () => {
    const result = critic.validate(null);
    expect(result.approved).toBe(false);
    expect(result.summary).toContain('Blocked');
  });

  test('should block undefined input', () => {
    const result = critic.validate(undefined);
    expect(result.approved).toBe(false);
  });

  test('should block non-object input', () => {
    const result = critic.validate('not an object');
    expect(result.approved).toBe(false);
    expect(result.enhancedConfidence).toBe(0);
  });

  // --- Gate 1: Confidence ---

  test('should pass confidence at exactly 0.70', () => {
    const report = { ...validReport, confidence: 0.70 };
    const result = critic.validate(report);
    expect(result.gates.confidence.passed).toBe(true);
  });

  test('should fail confidence below 0.70', () => {
    const report = { ...validReport, confidence: 0.69 };
    const result = critic.validate(report);
    expect(result.gates.confidence.passed).toBe(false);
    expect(result.gates.confidence.reason).toContain('below threshold');
  });

  test('should fail confidence when missing', () => {
    const report = { ...validReport };
    delete report.confidence;
    const result = critic.validate(report);
    expect(result.gates.confidence.passed).toBe(false);
    expect(result.gates.confidence.reason).toContain('missing');
  });

  test('should fail confidence when not a number', () => {
    const report = { ...validReport, confidence: 'high' };
    const result = critic.validate(report);
    expect(result.gates.confidence.passed).toBe(false);
  });

  test('should fail confidence outside valid range', () => {
    const report = { ...validReport, confidence: 1.5 };
    const result = critic.validate(report);
    expect(result.gates.confidence.passed).toBe(false);
    expect(result.gates.confidence.reason).toContain('outside valid range');
  });

  test('should fail confidence when negative', () => {
    const report = { ...validReport, confidence: -0.1 };
    const result = critic.validate(report);
    expect(result.gates.confidence.passed).toBe(false);
  });

  test('should pass confidence at 1.0', () => {
    const report = { ...validReport, confidence: 1.0 };
    const result = critic.validate(report);
    expect(result.gates.confidence.passed).toBe(true);
  });

  test('should fail confidence when NaN', () => {
    const report = { ...validReport, confidence: NaN };
    const result = critic.validate(report);
    expect(result.gates.confidence.passed).toBe(false);
  });

  // --- Gate 2: Evidence citations ---

  test('should pass evidence with valid file:line citations', () => {
    const result = critic.validate(validReport);
    expect(result.gates.evidence.passed).toBe(true);
  });

  test('should fail evidence when not an array', () => {
    const report = { ...validReport, evidence: 'src/file.js:10' };
    const result = critic.validate(report);
    expect(result.gates.evidence.passed).toBe(false);
    expect(result.gates.evidence.reason).toContain('must be an array');
  });

  test('should fail evidence when array is empty', () => {
    const report = { ...validReport, evidence: [] };
    const result = critic.validate(report);
    expect(result.gates.evidence.passed).toBe(false);
    expect(result.gates.evidence.reason).toContain('empty');
  });

  test('should fail evidence with invalid citation format', () => {
    const report = { ...validReport, evidence: ['src/file.js:10', 'no-line-number'] };
    const result = critic.validate(report);
    expect(result.gates.evidence.passed).toBe(false);
    expect(result.gates.evidence.reason).toContain('do not match file:line format');
  });

  test('should fail evidence with non-string entries', () => {
    const report = { ...validReport, evidence: [42, null] };
    const result = critic.validate(report);
    expect(result.gates.evidence.passed).toBe(false);
  });

  test('should pass evidence with single valid citation', () => {
    const report = { ...validReport, evidence: ['src/app.js:1'] };
    const result = critic.validate(report);
    expect(result.gates.evidence.passed).toBe(true);
  });

  test('should report invalid citations in detail', () => {
    const report = { ...validReport, evidence: ['valid.js:1', 'invalid', 'also-invalid'] };
    const result = critic.validate(report);
    expect(result.gates.evidence.passed).toBe(false);
    expect(result.gates.evidence.invalid).toHaveLength(2);
  });

  // --- Gate 3: Fix plan ---

  test('should pass fix plan with actionable content', () => {
    const result = critic.validate(validReport);
    expect(result.gates.fix_plan.passed).toBe(true);
  });

  test('should fail fix plan when missing', () => {
    const report = { ...validReport };
    delete report.fix_plan;
    const result = critic.validate(report);
    expect(result.gates.fix_plan.passed).toBe(false);
    expect(result.gates.fix_plan.reason).toContain('missing');
  });

  test('should fail fix plan when empty string', () => {
    const report = { ...validReport, fix_plan: '' };
    const result = critic.validate(report);
    expect(result.gates.fix_plan.passed).toBe(false);
  });

  test('should fail fix plan when too short', () => {
    const report = { ...validReport, fix_plan: 'fix it' };
    const result = critic.validate(report);
    expect(result.gates.fix_plan.passed).toBe(false);
    expect(result.gates.fix_plan.reason).toContain('too vague');
  });

  test('should fail fix plan when whitespace only', () => {
    const report = { ...validReport, fix_plan: '          ' };
    const result = critic.validate(report);
    expect(result.gates.fix_plan.passed).toBe(false);
  });

  // --- Gate 4: Rollback plan ---

  test('should pass rollback with feasible content', () => {
    const result = critic.validate(validReport);
    expect(result.gates.rollback.passed).toBe(true);
  });

  test('should fail rollback when missing', () => {
    const report = { ...validReport };
    delete report.rollback;
    const result = critic.validate(report);
    expect(result.gates.rollback.passed).toBe(false);
  });

  test('should fail rollback when empty', () => {
    const report = { ...validReport, rollback: '' };
    const result = critic.validate(report);
    expect(result.gates.rollback.passed).toBe(false);
  });

  test('should fail rollback when too short', () => {
    const report = { ...validReport, rollback: 'revert' };
    const result = critic.validate(report);
    expect(result.gates.rollback.passed).toBe(false);
    expect(result.gates.rollback.reason).toContain('too vague');
  });

  test('should fail rollback when not a string', () => {
    const report = { ...validReport, rollback: 123 };
    const result = critic.validate(report);
    expect(result.gates.rollback.passed).toBe(false);
  });

  // --- Gate 5: Tests ---

  test('should pass tests with valid entries', () => {
    const result = critic.validate(validReport);
    expect(result.gates.tests.passed).toBe(true);
  });

  test('should fail tests when not an array', () => {
    const report = { ...validReport, tests: 'some test' };
    const result = critic.validate(report);
    expect(result.gates.tests.passed).toBe(false);
  });

  test('should fail tests when array is empty', () => {
    const report = { ...validReport, tests: [] };
    const result = critic.validate(report);
    expect(result.gates.tests.passed).toBe(false);
  });

  test('should fail tests with empty string entries', () => {
    const report = { ...validReport, tests: ['valid test', ''] };
    const result = critic.validate(report);
    expect(result.gates.tests.passed).toBe(false);
  });

  test('should fail tests with non-string entries', () => {
    const report = { ...validReport, tests: [42, null] };
    const result = critic.validate(report);
    expect(result.gates.tests.passed).toBe(false);
  });

  // --- Enhanced confidence scoring ---

  test('should compute enhanced confidence as ratio of passed gates', () => {
    // All 5 pass = 1.0
    const result = critic.validate(validReport);
    expect(result.enhancedConfidence).toBe(1.0);
  });

  test('should compute partial enhanced confidence', () => {
    // Only confidence gate fails (4/5 pass = 0.80)
    const report = { ...validReport, confidence: 0.50 };
    const result = critic.validate(report);
    expect(result.enhancedConfidence).toBe(0.8);
    expect(result.approved).toBe(false);
  });

  test('should compute zero enhanced confidence for blocked input', () => {
    const result = critic.validate(null);
    expect(result.enhancedConfidence).toBe(0);
  });

  // --- Summary messages ---

  test('should include failure count in summary', () => {
    const report = { ...validReport, confidence: 0.50, evidence: [] };
    const result = critic.validate(report);
    expect(result.summary).toContain('gate(s) failed');
    expect(result.summary).toContain('blocked');
  });

  test('should report correct gate count for multiple failures', () => {
    const report = {
      root_cause: 'test',
      evidence: [],
      fix_plan: '',
      rollback: '',
      tests: [],
      confidence: 0.50,
    };
    const result = critic.validate(report);
    expect(result.passedCount).toBe(0);
    expect(result.approved).toBe(false);
    expect(result.enhancedConfidence).toBe(0);
  });
});
