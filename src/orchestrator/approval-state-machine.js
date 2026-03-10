/**
 * Approval State Machine for Debug Copilot Orchestration
 *
 * States: pending, skeptic_review, verifier_review, awaiting_approver,
 *         approved, blocked, escalated, user_override
 *
 * Implements the formal state machine from Phase 2.3.
 */

const VALID_STATES = [
  'pending',
  'skeptic_review',
  'verifier_review',
  'awaiting_approver',
  'approved',
  'blocked',
  'escalated',
  'user_override'
];

const TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours per state
const ESCALATION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours for user response

export class ApprovalStateMachine {
  constructor(taskId, auditLogger) {
    this.taskId = taskId;
    this.state = 'pending';
    this.history = [];
    this.auditLogger = auditLogger;
    this.stateEnteredAt = Date.now();
    this.verdicts = {
      skeptic: null,
      verifier: null,
      approver: null
    };
  }

  getState() {
    return this.state;
  }

  getVerdicts() {
    return { ...this.verdicts };
  }

  getHistory() {
    return [...this.history];
  }

  transition(action) {
    const fromState = this.state;
    let toState;

    switch (fromState) {
      case 'pending':
        toState = this._handlePending(action);
        break;
      case 'skeptic_review':
        toState = this._handleSkepticReview(action);
        break;
      case 'verifier_review':
        toState = this._handleVerifierReview(action);
        break;
      case 'awaiting_approver':
        toState = this._handleAwaitingApprover(action);
        break;
      case 'escalated':
        toState = this._handleEscalated(action);
        break;
      case 'user_override':
        toState = this._handleUserOverride(action);
        break;
      case 'approved':
      case 'blocked':
        throw new Error(`Cannot transition from terminal state: ${fromState}`);
      default:
        throw new Error(`Unknown state: ${fromState}`);
    }

    if (!VALID_STATES.includes(toState)) {
      throw new Error(`Invalid target state: ${toState}`);
    }

    this.history.push({
      from: fromState,
      to: toState,
      action,
      timestamp: new Date().toISOString()
    });

    this.state = toState;
    this.stateEnteredAt = Date.now();

    if (this.auditLogger) {
      this.auditLogger.log({
        event: 'state_transition',
        taskId: this.taskId,
        from: fromState,
        to: toState,
        action,
        timestamp: new Date().toISOString()
      });
    }

    return toState;
  }

  checkTimeout() {
    const elapsed = Date.now() - this.stateEnteredAt;
    const timeout = this.state === 'escalated' ? ESCALATION_TIMEOUT_MS : TIMEOUT_MS;

    if (elapsed > timeout) {
      return this.transition({ type: 'timeout' });
    }
    return this.state;
  }

  _handlePending(action) {
    if (action.type === 'start_review') {
      return 'skeptic_review';
    }
    if (action.type === 'timeout') {
      return 'escalated';
    }
    throw new Error(`Invalid action '${action.type}' for state 'pending'`);
  }

  _handleSkepticReview(action) {
    if (action.type === 'skeptic_verdict') {
      this.verdicts.skeptic = action.verdict;
      if (action.verdict === 'block') {
        return 'blocked';
      }
      if (action.verdict === 'approve') {
        return 'verifier_review';
      }
      if (action.verdict === 'challenge') {
        return 'verifier_review';
      }
      throw new Error(`Invalid skeptic verdict: ${action.verdict}`);
    }
    if (action.type === 'timeout') {
      return 'escalated';
    }
    throw new Error(`Invalid action '${action.type}' for state 'skeptic_review'`);
  }

  _handleVerifierReview(action) {
    if (action.type === 'verifier_verdict') {
      this.verdicts.verifier = action.verdict;
      if (action.verdict === 'proceed') {
        return 'awaiting_approver';
      }
      if (action.verdict === 'unverifiable') {
        if (this.verdicts.skeptic === 'challenge') {
          return 'escalated';
        }
        return 'awaiting_approver';
      }
      throw new Error(`Invalid verifier verdict: ${action.verdict}`);
    }
    if (action.type === 'timeout') {
      return 'escalated';
    }
    throw new Error(`Invalid action '${action.type}' for state 'verifier_review'`);
  }

  _handleAwaitingApprover(action) {
    if (action.type === 'approver_verdict') {
      this.verdicts.approver = action.verdict;
      if (action.verdict === 'approve') {
        if (this.verdicts.skeptic === 'approve') {
          return 'approved';
        }
        // Skeptic did not approve (challenge or other) - must escalate
        return 'escalated';
      }
      if (action.verdict === 'deny') {
        return 'blocked';
      }
      throw new Error(`Invalid approver verdict: ${action.verdict}`);
    }
    if (action.type === 'timeout') {
      return 'escalated';
    }
    throw new Error(`Invalid action '${action.type}' for state 'awaiting_approver'`);
  }

  _handleEscalated(action) {
    if (action.type === 'user_decision') {
      if (action.decision === 'override_approve') {
        if (!action.justification) {
          throw new Error('User override requires written justification');
        }
        return 'user_override';
      }
      if (action.decision === 'reject') {
        return 'blocked';
      }
      throw new Error(`Invalid user decision: ${action.decision}`);
    }
    if (action.type === 'timeout') {
      // Auto-escalate to management after 8 hours
      return 'blocked';
    }
    throw new Error(`Invalid action '${action.type}' for state 'escalated'`);
  }

  _handleUserOverride(action) {
    if (action.type === 'finalize') {
      return 'approved';
    }
    throw new Error(`Invalid action '${action.type}' for state 'user_override'`);
  }
}

export { VALID_STATES, TIMEOUT_MS, ESCALATION_TIMEOUT_MS };
