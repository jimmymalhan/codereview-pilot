/**
 * Critic Agent
 *
 * Validates quality gates before final diagnostic output is emitted.
 * Gates:
 *   1. Confidence score >= 0.70
 *   2. All evidence citations use file:line format
 *   3. Fix plan is present and actionable
 *   4. Rollback plan is present and feasible
 *   5. Tests array is present and non-empty
 *
 * Returns a gate report with pass/fail per gate and an enhanced confidence
 * score (0.0-1.0) reflecting how many gates passed.
 */

const FILE_LINE_PATTERN = /^.+:\d+$/;
const CONFIDENCE_THRESHOLD = 0.70;
const GATE_WEIGHT = 0.20; // 5 gates, each worth 0.20

export class CriticAgent {
  /**
   * Validate a diagnostic report against all quality gates.
   *
   * @param {object} report - Diagnostic output to validate
   * @param {string}        report.root_cause  - Root cause description
   * @param {Array<string>} report.evidence    - Evidence citations (file:line format)
   * @param {string}        report.fix_plan    - Proposed fix
   * @param {string}        report.rollback    - Rollback strategy
   * @param {Array<string>} report.tests       - Test cases
   * @param {number}        report.confidence  - Confidence score (0.0-1.0)
   * @returns {object} Gate report
   */
  validate(report) {
    if (!report || typeof report !== 'object') {
      return this._blocked('Input must be a valid diagnostic report object');
    }

    const gates = {
      confidence: this._validateConfidence(report.confidence),
      evidence: this._validateEvidence(report.evidence),
      fix_plan: this._validateFixPlan(report.fix_plan),
      rollback: this._validateRollback(report.rollback),
      tests: this._validateTests(report.tests),
    };

    const passedCount = Object.values(gates).filter(g => g.passed).length;
    const totalGates = Object.keys(gates).length;
    const enhancedConfidence = parseFloat((passedCount * GATE_WEIGHT).toFixed(2));

    const allPassed = passedCount === totalGates;

    return {
      approved: allPassed,
      gates,
      passedCount,
      totalGates,
      enhancedConfidence,
      summary: allPassed
        ? 'All quality gates passed'
        : `${totalGates - passedCount} gate(s) failed — output blocked`,
    };
  }

  /**
   * Gate 1: Confidence score must be >= 0.70
   */
  _validateConfidence(confidence) {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
      return { passed: false, reason: 'Confidence score is missing or not a number' };
    }
    if (confidence < 0 || confidence > 1) {
      return { passed: false, reason: `Confidence ${confidence} is outside valid range [0, 1]` };
    }
    if (confidence < CONFIDENCE_THRESHOLD) {
      return { passed: false, reason: `Confidence ${confidence} is below threshold ${CONFIDENCE_THRESHOLD}` };
    }
    return { passed: true, reason: `Confidence ${confidence} meets threshold ${CONFIDENCE_THRESHOLD}` };
  }

  /**
   * Gate 2: Evidence must be a non-empty array of file:line citations
   */
  _validateEvidence(evidence) {
    if (!Array.isArray(evidence)) {
      return { passed: false, reason: 'Evidence must be an array' };
    }
    if (evidence.length === 0) {
      return { passed: false, reason: 'Evidence array is empty' };
    }

    const invalid = [];
    evidence.forEach((citation, index) => {
      if (typeof citation !== 'string' || !FILE_LINE_PATTERN.test(citation)) {
        invalid.push({ index, citation });
      }
    });

    if (invalid.length > 0) {
      return {
        passed: false,
        reason: `${invalid.length} citation(s) do not match file:line format`,
        invalid,
      };
    }

    return { passed: true, reason: `All ${evidence.length} citation(s) use file:line format` };
  }

  /**
   * Gate 3: Fix plan must be a non-empty string with actionable content
   */
  _validateFixPlan(fixPlan) {
    if (typeof fixPlan !== 'string') {
      return { passed: false, reason: 'Fix plan is missing or not a string' };
    }
    if (fixPlan.trim().length === 0) {
      return { passed: false, reason: 'Fix plan is empty' };
    }
    if (fixPlan.trim().length < 10) {
      return { passed: false, reason: 'Fix plan is too vague (less than 10 characters)' };
    }
    return { passed: true, reason: 'Fix plan is present and actionable' };
  }

  /**
   * Gate 4: Rollback plan must be a non-empty string describing how to reverse
   */
  _validateRollback(rollback) {
    if (typeof rollback !== 'string') {
      return { passed: false, reason: 'Rollback plan is missing or not a string' };
    }
    if (rollback.trim().length === 0) {
      return { passed: false, reason: 'Rollback plan is empty' };
    }
    if (rollback.trim().length < 10) {
      return { passed: false, reason: 'Rollback plan is too vague (less than 10 characters)' };
    }
    return { passed: true, reason: 'Rollback plan is present and feasible' };
  }

  /**
   * Gate 5: Tests must be a non-empty array of strings
   */
  _validateTests(tests) {
    if (!Array.isArray(tests)) {
      return { passed: false, reason: 'Tests must be an array' };
    }
    if (tests.length === 0) {
      return { passed: false, reason: 'Tests array is empty' };
    }

    const invalid = tests.filter(t => typeof t !== 'string' || t.trim().length === 0);
    if (invalid.length > 0) {
      return { passed: false, reason: `${invalid.length} test(s) are empty or not strings` };
    }

    return { passed: true, reason: `${tests.length} test case(s) provided` };
  }

  /**
   * Return a blocked result when input is fundamentally invalid
   */
  _blocked(reason) {
    return {
      approved: false,
      gates: {},
      passedCount: 0,
      totalGates: 5,
      enhancedConfidence: 0,
      summary: `Blocked: ${reason}`,
    };
  }
}

export default CriticAgent;
