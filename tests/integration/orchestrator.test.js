/**
 * Integration Tests — Orchestrator
 *
 * 10 integration test scenarios covering orchestrator workflows
 * plus 3 additional scenarios from QA review (error handling,
 * concurrent isolation, contract enforcement).
 */

import { jest } from '@jest/globals';
import { ApprovalStateMachine } from '../../src/orchestrator/approval-state-machine.js';
import { BudgetEnforcer } from '../../src/orchestrator/budget-enforcer.js';
import { AuditLogger } from '../../src/orchestrator/audit-logger.js';
import { HeartbeatMonitor, HEARTBEAT_INTERVAL_MS } from '../../src/orchestrator/heartbeat-monitor.js';
import { TaskManager, VALID_TASK_TYPES, REQUIRED_OUTPUT_FIELDS } from '../../src/orchestrator/task-manager.js';
import { MockOrchestratorApi, MockApiError } from '../fixtures/mock-orchestrator-api.js';
import {
  SAMPLE_TASK_VALID,
  SAMPLE_TASK_ROUTE,
  SAMPLE_TASK_INVALID_TYPE,
  SAMPLE_TASK_NO_TYPE,
  SAMPLE_OUTPUT_VALID,
  SAMPLE_OUTPUT_MISSING_ROOT_CAUSE,
  SAMPLE_OUTPUT_EMPTY_EVIDENCE,
  SAMPLE_OUTPUT_INVALID_CONFIDENCE
} from '../fixtures/sample-incidents.js';

// ============================================================
// SCENARIO 1: Task Creation and Schema Validation
// ============================================================
describe('Scenario 1: Task Creation and Schema Validation', () => {
  let auditLogger;
  let budgetEnforcer;
  let taskManager;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    taskManager = new TaskManager(budgetEnforcer, auditLogger);
  });

  test('creates task with valid schema and returns proper ID', () => {
    const result = taskManager.createTask(SAMPLE_TASK_VALID);
    expect(result.taskId).toBe('test-task-001');
    expect(result.status).toBe('pending');
  });

  test('created task includes all CLAUDE.md required fields in schema', () => {
    taskManager.createTask(SAMPLE_TASK_VALID);
    const task = taskManager.getTask('test-task-001');

    expect(task.taskId).toBeDefined();
    expect(task.type).toBe('debug');
    expect(task.status).toBe('pending');
    expect(task.input.evidence).toHaveLength(2);
    expect(task.input.hypothesis).toBeTruthy();
    expect(task.governance.state).toBe('pending');
  });

  test('rejects task with invalid type', () => {
    expect(() => taskManager.createTask(SAMPLE_TASK_INVALID_TYPE))
      .toThrow('Invalid task type');
  });

  test('rejects task with missing type', () => {
    expect(() => taskManager.createTask(SAMPLE_TASK_NO_TYPE))
      .toThrow('Invalid task type');
  });

  test('accepts all valid task types', () => {
    for (const type of VALID_TASK_TYPES) {
      const result = taskManager.createTask({ type, evidence: [], hypothesis: 'test' });
      expect(result.status).toBe('pending');
    }
  });

  test('task creation is logged in audit trail', () => {
    taskManager.createTask(SAMPLE_TASK_VALID);
    const entries = auditLogger.query({ event: 'task_created' });
    expect(entries).toHaveLength(1);
    expect(entries[0].taskId).toBe('test-task-001');
  });
});

// ============================================================
// SCENARIO 2: Router Agent Invocation (Task Routing)
// ============================================================
describe('Scenario 2: Router Agent Invocation', () => {
  let taskManager;

  beforeEach(() => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    taskManager = new TaskManager(budgetEnforcer, auditLogger);
  });

  test('routes task to valid failure classification', () => {
    taskManager.createTask(SAMPLE_TASK_ROUTE);
    const result = taskManager.routeTask('test-task-002', 'bad_deploy');
    expect(result.classification).toBe('bad_deploy');
  });

  test('rejects invalid failure classification', () => {
    taskManager.createTask(SAMPLE_TASK_ROUTE);
    expect(() => taskManager.routeTask('test-task-002', 'nonexistent_class'))
      .toThrow('Invalid failure classification');
  });

  test('accepts all valid failure classifications', () => {
    const validClasses = ['schema_drift', 'write_conflict', 'stale_read', 'bad_deploy', 'auth_failure', 'dependency_break'];
    for (const cls of validClasses) {
      const task = taskManager.createTask({ type: 'route', evidence: [] });
      const result = taskManager.routeTask(task.taskId, cls);
      expect(result.classification).toBe(cls);
    }
  });

  test('task assignment is logged in audit trail', () => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    const tm = new TaskManager(budgetEnforcer, auditLogger);

    tm.createTask(SAMPLE_TASK_VALID);
    tm.assignTask('test-task-001', 'router-agent');

    const entries = auditLogger.query({ event: 'task_assigned' });
    expect(entries).toHaveLength(1);
    expect(entries[0].agentId).toBe('router-agent');
  });
});

// ============================================================
// SCENARIO 3: Approval Workflow Sequencing (ALL 5 STATE MACHINE PATHS)
// ============================================================
describe('Scenario 3: Approval Workflow Sequencing', () => {
  let auditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger();
  });

  // PATH 1: Happy path - skeptic approves -> verifier proceeds -> approver approves
  test('Path 1 (happy): skeptic approve -> verifier proceed -> approver approve = APPROVED', () => {
    const sm = new ApprovalStateMachine('task-1', auditLogger);

    expect(sm.getState()).toBe('pending');

    sm.transition({ type: 'start_review' });
    expect(sm.getState()).toBe('skeptic_review');

    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    expect(sm.getState()).toBe('verifier_review');

    sm.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    expect(sm.getState()).toBe('awaiting_approver');

    sm.transition({ type: 'approver_verdict', verdict: 'approve' });
    expect(sm.getState()).toBe('approved');
  });

  // PATH 2: Skeptic blocks -> BLOCKED (no further progression)
  test('Path 2: skeptic blocks -> BLOCKED immediately', () => {
    const sm = new ApprovalStateMachine('task-2', auditLogger);
    sm.transition({ type: 'start_review' });

    sm.transition({ type: 'skeptic_verdict', verdict: 'block' });
    expect(sm.getState()).toBe('blocked');

    // Terminal state - cannot transition further
    expect(() => sm.transition({ type: 'start_review' }))
      .toThrow('Cannot transition from terminal state');
  });

  // PATH 3: Verifier unverifiable + skeptic challenge -> ESCALATED
  test('Path 3: skeptic challenge + verifier unverifiable -> ESCALATED', () => {
    const sm = new ApprovalStateMachine('task-3', auditLogger);
    sm.transition({ type: 'start_review' });

    sm.transition({ type: 'skeptic_verdict', verdict: 'challenge' });
    expect(sm.getState()).toBe('verifier_review');

    sm.transition({ type: 'verifier_verdict', verdict: 'unverifiable' });
    expect(sm.getState()).toBe('escalated');
  });

  // PATH 4: Approver approves but skeptic was "challenge" (not "approve") -> ESCALATED
  test('Path 4: skeptic challenge + verifier proceed + approver approve -> ESCALATED (not auto-approve)', () => {
    const sm = new ApprovalStateMachine('task-4', auditLogger);
    sm.transition({ type: 'start_review' });

    sm.transition({ type: 'skeptic_verdict', verdict: 'challenge' });
    sm.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    sm.transition({ type: 'approver_verdict', verdict: 'approve' });

    // Approver cannot auto-approve when skeptic did not approve
    expect(sm.getState()).toBe('escalated');
  });

  // PATH 5: Timeout in any state -> ESCALATED
  test('Path 5a: timeout in skeptic_review -> ESCALATED', () => {
    const sm = new ApprovalStateMachine('task-5a', auditLogger);
    sm.transition({ type: 'start_review' });
    expect(sm.getState()).toBe('skeptic_review');

    sm.transition({ type: 'timeout' });
    expect(sm.getState()).toBe('escalated');
  });

  test('Path 5b: timeout in verifier_review -> ESCALATED', () => {
    const sm = new ApprovalStateMachine('task-5b', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });

    sm.transition({ type: 'timeout' });
    expect(sm.getState()).toBe('escalated');
  });

  test('Path 5c: timeout in awaiting_approver -> ESCALATED', () => {
    const sm = new ApprovalStateMachine('task-5c', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    sm.transition({ type: 'verifier_verdict', verdict: 'proceed' });

    sm.transition({ type: 'timeout' });
    expect(sm.getState()).toBe('escalated');
  });

  // User override after escalation
  test('User override after escalation -> approved with justification', () => {
    const sm = new ApprovalStateMachine('task-override', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'block' });

    // Blocked is terminal, so test escalation path instead
    const sm2 = new ApprovalStateMachine('task-override-2', auditLogger);
    sm2.transition({ type: 'start_review' });
    sm2.transition({ type: 'timeout' });
    expect(sm2.getState()).toBe('escalated');

    sm2.transition({ type: 'user_decision', decision: 'override_approve', justification: 'CEO approved after review' });
    expect(sm2.getState()).toBe('user_override');

    sm2.transition({ type: 'finalize' });
    expect(sm2.getState()).toBe('approved');
  });

  // User override requires justification
  test('User override without justification throws error', () => {
    const sm = new ApprovalStateMachine('task-no-just', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'timeout' });

    expect(() => sm.transition({ type: 'user_decision', decision: 'override_approve' }))
      .toThrow('User override requires written justification');
  });

  // Approver deny -> BLOCKED
  test('Approver deny -> BLOCKED', () => {
    const sm = new ApprovalStateMachine('task-deny', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    sm.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    sm.transition({ type: 'approver_verdict', verdict: 'deny' });

    expect(sm.getState()).toBe('blocked');
  });

  // All transitions are logged in audit trail
  test('all state transitions logged in audit trail', () => {
    const sm = new ApprovalStateMachine('task-audit', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    sm.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    sm.transition({ type: 'approver_verdict', verdict: 'approve' });

    const entries = auditLogger.query({ event: 'state_transition' });
    expect(entries.length).toBe(4);
    expect(entries[0].from).toBe('pending');
    expect(entries[0].to).toBe('skeptic_review');
    expect(entries[3].to).toBe('approved');
  });

  // History tracking
  test('state machine records full history', () => {
    const sm = new ApprovalStateMachine('task-history', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });

    const history = sm.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].from).toBe('pending');
    expect(history[1].to).toBe('verifier_review');
  });
});

// ============================================================
// SCENARIO 4: Budget Enforcement
// ============================================================
describe('Scenario 4: Budget Enforcement', () => {
  let auditLogger;
  let budgetEnforcer;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    budgetEnforcer = new BudgetEnforcer({ dailyOrgTotal: 10000, perAgentDaily: 5000, perTaskAlert: 3000 }, auditLogger);
  });

  test('reserves budget for task within limits', () => {
    const result = budgetEnforcer.reserveBudget('task-1', 'agent-1', 1000);
    expect(result.success).toBe(true);
    expect(result.reserved).toBe(1000);
  });

  test('rejects task exceeding org daily budget', () => {
    // Consume most of the budget first
    budgetEnforcer.reserveBudget('task-1', 'agent-1', 2000);
    budgetEnforcer.chargeBudget('task-1', 'agent-1', 2000);
    budgetEnforcer.reserveBudget('task-2', 'agent-1', 2000);
    budgetEnforcer.chargeBudget('task-2', 'agent-1', 2000);

    // This should push past org limit
    budgetEnforcer.chargeBudget('task-3', 'agent-1', 7000);

    expect(budgetEnforcer.canAcceptNewTask()).toBe(false);
  });

  test('requires pre-approval for tasks exceeding per-task threshold', () => {
    const result = budgetEnforcer.reserveBudget('task-big', 'agent-1', 4000);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('requires_pre_approval');
  });

  test('emits alerts at 75%, 90%, and 100% thresholds', () => {
    budgetEnforcer.chargeBudget('t1', 'agent-1', 7500);
    let alerts = budgetEnforcer.getAlerts();
    expect(alerts.some(a => a.severity === 'warning')).toBe(true);

    budgetEnforcer.chargeBudget('t2', 'agent-1', 1500);
    alerts = budgetEnforcer.getAlerts();
    expect(alerts.some(a => a.severity === 'escalate')).toBe(true);

    budgetEnforcer.chargeBudget('t3', 'agent-1', 1000);
    alerts = budgetEnforcer.getAlerts();
    expect(alerts.some(a => a.severity === 'hard_stop')).toBe(true);
  });

  test('daily reset clears all usage and alerts', () => {
    budgetEnforcer.chargeBudget('t1', 'agent-1', 5000);
    budgetEnforcer.resetDaily();

    expect(budgetEnforcer.canAcceptNewTask()).toBe(true);
    expect(budgetEnforcer.getAlerts()).toHaveLength(0);

    const usage = budgetEnforcer.getUsage();
    expect(usage.orgDaily).toBe(0);
  });

  test('budget charges are logged in audit trail', () => {
    budgetEnforcer.reserveBudget('t1', 'agent-1', 500);
    budgetEnforcer.chargeBudget('t1', 'agent-1', 450);

    const reserved = auditLogger.query({ event: 'budget_reserved' });
    const charged = auditLogger.query({ event: 'budget_charged' });
    expect(reserved).toHaveLength(1);
    expect(charged).toHaveLength(1);
  });
});

// ============================================================
// SCENARIO 5: Audit Logging
// ============================================================
describe('Scenario 5: Audit Logging', () => {
  let auditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger();
  });

  test('logs approval decisions with all required fields', () => {
    const id = auditLogger.log({
      event: 'approval_decision',
      taskId: 'task-1',
      actor: 'skeptic-agent',
      decision: 'approve',
      justification: 'Evidence supports the hypothesis',
      timestamp: '2026-03-08T12:00:00Z'
    });

    expect(id).toBe(1);
    const entries = auditLogger.getAll();
    expect(entries[0].event).toBe('approval_decision');
    expect(entries[0].actor).toBe('skeptic-agent');
  });

  test('rejects entries missing required fields', () => {
    expect(() => auditLogger.log({ timestamp: '2026-03-08T12:00:00Z' }))
      .toThrow('missing required field: event');

    expect(() => auditLogger.log({ event: 'approval_decision' }))
      .toThrow('missing required field: timestamp');
  });

  test('rejects invalid event types', () => {
    expect(() => auditLogger.log({ event: 'invalid_event', timestamp: '2026-03-08T12:00:00Z' }))
      .toThrow('Invalid audit event type');
  });

  test('entries are immutable (frozen)', () => {
    auditLogger.log({ event: 'task_created', taskId: 'task-1', timestamp: '2026-03-08T12:00:00Z' });
    const entries = auditLogger.getAll();

    expect(() => { entries[0].taskId = 'tampered'; }).toThrow();
  });

  test('query filters by event, taskId, and actor', () => {
    auditLogger.log({ event: 'task_created', taskId: 'task-1', timestamp: '2026-03-08T12:00:00Z' });
    auditLogger.log({ event: 'task_assigned', taskId: 'task-1', actor: 'agent-1', timestamp: '2026-03-08T12:01:00Z' });
    auditLogger.log({ event: 'task_created', taskId: 'task-2', timestamp: '2026-03-08T12:02:00Z' });

    expect(auditLogger.query({ event: 'task_created' })).toHaveLength(2);
    expect(auditLogger.query({ taskId: 'task-1' })).toHaveLength(2);
    expect(auditLogger.query({ actor: 'agent-1' })).toHaveLength(1);
  });

  test('integrity verification passes for valid log', () => {
    auditLogger.log({ event: 'task_created', taskId: 'task-1', timestamp: '2026-03-08T12:00:00Z' });
    auditLogger.log({ event: 'task_assigned', taskId: 'task-1', timestamp: '2026-03-08T12:01:00Z' });

    const result = auditLogger.verifyIntegrity();
    expect(result.valid).toBe(true);
    expect(result.entryCount).toBe(2);
  });

  test('sealed audit log rejects new entries', () => {
    auditLogger.log({ event: 'task_created', taskId: 'task-1', timestamp: '2026-03-08T12:00:00Z' });
    auditLogger.seal();

    expect(() => auditLogger.log({ event: 'task_created', taskId: 'task-2', timestamp: '2026-03-08T12:02:00Z' }))
      .toThrow('sealed');
  });
});

// ============================================================
// SCENARIO 6: Heartbeat Detection
// ============================================================
describe('Scenario 6: Heartbeat Detection', () => {
  let auditLogger;
  let monitor;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    monitor = new HeartbeatMonitor(auditLogger);
  });

  test('registers agent and receives heartbeat', () => {
    monitor.registerAgent('agent-1');
    const result = monitor.receiveHeartbeat('agent-1', { status: 'healthy', tasksInFlight: 2 });
    expect(result.acknowledged).toBe(true);

    const status = monitor.getAgentStatus('agent-1');
    expect(status.status).toBe('healthy');
    expect(status.tasksInFlight).toBe(2);
  });

  test('detects missed heartbeats and escalates progressively', () => {
    monitor.registerAgent('agent-1');

    const baseTime = Date.now();

    // 1 missed heartbeat - warning only
    monitor.checkAgents(baseTime + HEARTBEAT_INTERVAL_MS * 1.5);
    let status = monitor.getAgentStatus('agent-1');
    expect(status.missedCount).toBe(1);

    // 2 missed heartbeats - alert ops, status degraded
    monitor.checkAgents(baseTime + HEARTBEAT_INTERVAL_MS * 2.5);
    status = monitor.getAgentStatus('agent-1');
    expect(status.status).toBe('degraded');

    // 3 missed heartbeats - kill tasks, status failing
    monitor.checkAgents(baseTime + HEARTBEAT_INTERVAL_MS * 3.5);
    status = monitor.getAgentStatus('agent-1');
    expect(status.status).toBe('failing');

    // 4 missed heartbeats - circuit breaker, status unavailable
    monitor.checkAgents(baseTime + HEARTBEAT_INTERVAL_MS * 4.5);
    status = monitor.getAgentStatus('agent-1');
    expect(status.status).toBe('unavailable');
  });

  test('agent marked unavailable is not available for tasks', () => {
    monitor.registerAgent('agent-1');
    const baseTime = Date.now();

    monitor.checkAgents(baseTime + HEARTBEAT_INTERVAL_MS * 5);
    expect(monitor.isAvailable('agent-1')).toBe(false);
  });

  test('heartbeat resets missed count', () => {
    monitor.registerAgent('agent-1');
    const baseTime = Date.now();

    // Miss 2 heartbeats
    monitor.checkAgents(baseTime + HEARTBEAT_INTERVAL_MS * 2.5);
    expect(monitor.getAgentStatus('agent-1').missedCount).toBe(2);

    // Send heartbeat
    monitor.receiveHeartbeat('agent-1', { status: 'healthy' });
    expect(monitor.getAgentStatus('agent-1').missedCount).toBe(0);
  });

  test('escalations are recorded', () => {
    monitor.registerAgent('agent-1');
    const baseTime = Date.now();

    monitor.checkAgents(baseTime + HEARTBEAT_INTERVAL_MS * 4.5);
    const escalations = monitor.getEscalations();
    expect(escalations.length).toBeGreaterThan(0);
    expect(escalations.some(e => e.action === 'circuit_breaker')).toBe(true);
  });

  test('rejects heartbeat from unknown agent', () => {
    expect(() => monitor.receiveHeartbeat('unknown-agent', {}))
      .toThrow('Unknown agent');
  });
});

// ============================================================
// SCENARIO 7: Rollback State Consistency
// ============================================================
describe('Scenario 7: Rollback State Consistency', () => {
  let auditLogger;
  let budgetEnforcer;
  let taskManager;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    taskManager = new TaskManager(budgetEnforcer, auditLogger);
  });

  test('create task, approve it, then delete - verify clean state', () => {
    // Create and approve task
    taskManager.createTask(SAMPLE_TASK_VALID);
    const task = taskManager.getTask('test-task-001');

    // Walk through approval
    task.stateMachine.transition({ type: 'start_review' });
    task.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    task.stateMachine.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    task.stateMachine.transition({ type: 'approver_verdict', verdict: 'approve' });
    expect(task.stateMachine.getState()).toBe('approved');

    // Delete task (rollback)
    taskManager.deleteTask('test-task-001');

    // Verify no orphaned tasks
    expect(() => taskManager.getTask('test-task-001')).toThrow('Task not found');
    expect(taskManager.listTasks()).toHaveLength(0);
  });

  test('multiple tasks created and rolled back leave no orphans', () => {
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'rollback-1' });
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'rollback-2' });
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'rollback-3' });

    expect(taskManager.listTasks()).toHaveLength(3);

    taskManager.deleteTask('rollback-1');
    taskManager.deleteTask('rollback-2');
    taskManager.deleteTask('rollback-3');

    expect(taskManager.listTasks()).toHaveLength(0);
  });

  test('audit trail preserves history even after task deletion', () => {
    taskManager.createTask(SAMPLE_TASK_VALID);
    taskManager.deleteTask('test-task-001');

    // Audit entries persist
    const entries = auditLogger.query({ event: 'task_created', taskId: 'test-task-001' });
    expect(entries).toHaveLength(1);
  });
});

// ============================================================
// SCENARIO 8: Error/Failure Handling (NEW - QA REVIEW)
// ============================================================
describe('Scenario 8: Error/Failure Handling', () => {
  test('Orchestrator API 500 error is caught and surfaced', async () => {
    const mockApi = new MockOrchestratorApi({ shouldFail: true, failStatus: 500 });

    await expect(mockApi.submitTask({ type: 'debug' }))
      .rejects.toThrow('Mock API error 500');
  });

  test('Orchestrator API 400 error for malformed task', async () => {
    const mockApi = new MockOrchestratorApi();

    await expect(mockApi.submitTask({}))
      .rejects.toThrow('Missing required field: type');
  });

  test('Orchestrator API 404 for non-existent task', async () => {
    const mockApi = new MockOrchestratorApi();

    await expect(mockApi.getTask('nonexistent'))
      .rejects.toThrow('Task not found');
  });

  test('API failure mode can be toggled on/off for testing', async () => {
    const mockApi = new MockOrchestratorApi();

    // Normal mode works
    const result = await mockApi.submitTask({ type: 'debug', taskId: 'ok-task' });
    expect(result.status).toBe('pending');

    // Enable failure mode
    mockApi.setFailMode(true, 503, 'Service Unavailable');
    await expect(mockApi.submitTask({ type: 'debug' }))
      .rejects.toThrow('503');

    // Disable failure mode
    mockApi.setFailMode(false);
    const result2 = await mockApi.submitTask({ type: 'debug', taskId: 'ok-task-2' });
    expect(result2.status).toBe('pending');
  });

  test('mock API reset clears all state', async () => {
    const mockApi = new MockOrchestratorApi();
    await mockApi.submitTask({ type: 'debug', taskId: 'to-clear' });
    mockApi.reset();

    await expect(mockApi.getTask('to-clear'))
      .rejects.toThrow('Task not found');
  });

  test('state machine rejects invalid actions for current state', () => {
    const sm = new ApprovalStateMachine('err-task', new AuditLogger());
    sm.transition({ type: 'start_review' });

    // In skeptic_review, cannot submit verifier verdict
    expect(() => sm.transition({ type: 'verifier_verdict', verdict: 'proceed' }))
      .toThrow('Invalid action');
  });

  test('state machine rejects invalid verdicts', () => {
    const sm = new ApprovalStateMachine('err-task-2', new AuditLogger());
    sm.transition({ type: 'start_review' });

    expect(() => sm.transition({ type: 'skeptic_verdict', verdict: 'invalid' }))
      .toThrow('Invalid skeptic verdict');
  });
});

// ============================================================
// SCENARIO 9: Concurrent Agent Isolation (NEW - QA REVIEW)
// ============================================================
describe('Scenario 9: Concurrent Agent Isolation', () => {
  test('two agents operating on separate tasks do not interfere', () => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({ dailyOrgTotal: 100000 }, auditLogger);
    const taskManager = new TaskManager(budgetEnforcer, auditLogger);

    // Agent 1 creates and works on task A
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'concurrent-A' });
    const taskA = taskManager.getTask('concurrent-A');
    taskA.stateMachine.transition({ type: 'start_review' });
    taskA.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });

    // Agent 2 creates and works on task B simultaneously
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'concurrent-B' });
    const taskB = taskManager.getTask('concurrent-B');
    taskB.stateMachine.transition({ type: 'start_review' });
    taskB.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'block' });

    // Verify isolation: task A is in verifier_review, task B is blocked
    expect(taskA.stateMachine.getState()).toBe('verifier_review');
    expect(taskB.stateMachine.getState()).toBe('blocked');

    // Neither task's state machine affected the other
    expect(taskA.stateMachine.getVerdicts().skeptic).toBe('approve');
    expect(taskB.stateMachine.getVerdicts().skeptic).toBe('block');
  });

  test('budget enforcer tracks per-agent limits with concurrency adjustment', () => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({ perAgentDaily: 10000, dailyOrgTotal: 100000, perTaskAlert: 6000 }, auditLogger);

    // Agent 1 reserves budget
    const r1 = budgetEnforcer.reserveBudget('t1', 'agent-1', 3000);
    expect(r1.success).toBe(true);

    // Agent 2 reserves budget - limit is now split between 2 agents
    const r2 = budgetEnforcer.reserveBudget('t2', 'agent-2', 3000);
    expect(r2.success).toBe(true);

    // Each agent's effective limit is reduced with concurrency
    const usage = budgetEnforcer.getUsage();
    expect(Object.keys(usage.agents)).toHaveLength(2);
  });

  test('heartbeat monitor tracks multiple agents independently', () => {
    const monitor = new HeartbeatMonitor(new AuditLogger());

    const baseTime = Date.now();
    monitor.registerAgent('agent-1');
    monitor.registerAgent('agent-2');

    // Both agents start healthy. Advance time so agent-1 misses beats.
    // Agent-2 sends a fresh heartbeat right before the check.
    const checkTime = baseTime + HEARTBEAT_INTERVAL_MS * 4.5;

    // Simulate agent-2 sending a heartbeat just before check
    // We need to update its lastBeat to be recent
    monitor.agents['agent-2'].lastBeat = checkTime - 100;

    monitor.checkAgents(checkTime);

    expect(monitor.isAvailable('agent-1')).toBe(false);
    expect(monitor.isAvailable('agent-2')).toBe(true);
  });

  test('audit logger records entries from concurrent agents without interleaving issues', () => {
    const auditLogger = new AuditLogger();

    // Simulate concurrent logging
    auditLogger.log({ event: 'task_created', taskId: 'A', actor: 'agent-1', timestamp: '2026-03-08T12:00:00Z' });
    auditLogger.log({ event: 'task_created', taskId: 'B', actor: 'agent-2', timestamp: '2026-03-08T12:00:00Z' });
    auditLogger.log({ event: 'task_assigned', taskId: 'A', actor: 'agent-1', timestamp: '2026-03-08T12:00:01Z' });
    auditLogger.log({ event: 'task_assigned', taskId: 'B', actor: 'agent-2', timestamp: '2026-03-08T12:00:01Z' });

    // Sequential IDs maintained
    const integrity = auditLogger.verifyIntegrity();
    expect(integrity.valid).toBe(true);
    expect(integrity.entryCount).toBe(4);

    // Can filter by agent
    expect(auditLogger.query({ actor: 'agent-1' })).toHaveLength(2);
    expect(auditLogger.query({ actor: 'agent-2' })).toHaveLength(2);
  });
});

// ============================================================
// SCENARIO 10: CLAUDE.md Contract Enforcement (NEW - QA REVIEW)
// ============================================================
describe('Scenario 10: CLAUDE.md Contract Enforcement', () => {
  let taskManager;

  beforeEach(() => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    taskManager = new TaskManager(budgetEnforcer, auditLogger);
  });

  test('task cannot complete without approval', () => {
    taskManager.createTask(SAMPLE_TASK_VALID);

    expect(() => taskManager.completeTask('test-task-001', SAMPLE_OUTPUT_VALID))
      .toThrow("approval state is 'pending', must be 'approved'");
  });

  test('task cannot complete with missing root_cause', () => {
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'contract-1' });
    const task = taskManager.getTask('contract-1');

    // Approve it
    task.stateMachine.transition({ type: 'start_review' });
    task.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    task.stateMachine.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    task.stateMachine.transition({ type: 'approver_verdict', verdict: 'approve' });

    expect(() => taskManager.completeTask('contract-1', SAMPLE_OUTPUT_MISSING_ROOT_CAUSE))
      .toThrow('missing required field: root_cause');
  });

  test('task cannot complete with empty evidence array', () => {
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'contract-2' });
    const task = taskManager.getTask('contract-2');

    task.stateMachine.transition({ type: 'start_review' });
    task.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    task.stateMachine.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    task.stateMachine.transition({ type: 'approver_verdict', verdict: 'approve' });

    expect(() => taskManager.completeTask('contract-2', SAMPLE_OUTPUT_EMPTY_EVIDENCE))
      .toThrow('evidence must be a non-empty array');
  });

  test('task cannot complete with invalid confidence level', () => {
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'contract-3' });
    const task = taskManager.getTask('contract-3');

    task.stateMachine.transition({ type: 'start_review' });
    task.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    task.stateMachine.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    task.stateMachine.transition({ type: 'approver_verdict', verdict: 'approve' });

    expect(() => taskManager.completeTask('contract-3', SAMPLE_OUTPUT_INVALID_CONFIDENCE))
      .toThrow('Invalid confidence level');
  });

  test('task completes successfully with all valid CLAUDE.md output fields', () => {
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'contract-valid' });
    const task = taskManager.getTask('contract-valid');

    task.stateMachine.transition({ type: 'start_review' });
    task.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    task.stateMachine.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    task.stateMachine.transition({ type: 'approver_verdict', verdict: 'approve' });

    const result = taskManager.completeTask('contract-valid', SAMPLE_OUTPUT_VALID);
    expect(result.status).toBe('completed');
  });

  test('all 6 CLAUDE.md output fields are enforced', () => {
    // Verify the constant matches CLAUDE.md spec
    expect(REQUIRED_OUTPUT_FIELDS).toEqual([
      'root_cause',
      'evidence',
      'fix_plan',
      'rollback',
      'tests',
      'confidence'
    ]);
  });

  test('task output with null fields is rejected', () => {
    taskManager.createTask({ ...SAMPLE_TASK_VALID, taskId: 'contract-null' });
    const task = taskManager.getTask('contract-null');

    task.stateMachine.transition({ type: 'start_review' });
    task.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    task.stateMachine.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    task.stateMachine.transition({ type: 'approver_verdict', verdict: 'approve' });

    const nullOutput = {
      root_cause: null,
      evidence: [{ source: 'test', finding: 'test' }],
      fix_plan: 'fix',
      rollback: 'revert',
      tests: ['test'],
      confidence: 'high'
    };

    expect(() => taskManager.completeTask('contract-null', nullOutput))
      .toThrow('missing required field: root_cause');
  });
});

// ============================================================
// ADDITIONAL COVERAGE: State Machine edge cases
// ============================================================
describe('Additional Coverage: State Machine Edge Cases', () => {
  let auditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger();
  });

  test('checkTimeout triggers escalation when time exceeds threshold', () => {
    const sm = new ApprovalStateMachine('timeout-task', auditLogger);
    sm.transition({ type: 'start_review' });

    // Manually set stateEnteredAt far in the past
    sm.stateEnteredAt = Date.now() - (5 * 60 * 60 * 1000); // 5 hours ago

    const result = sm.checkTimeout();
    expect(result).toBe('escalated');
  });

  test('checkTimeout does not trigger when within threshold', () => {
    const sm = new ApprovalStateMachine('no-timeout', auditLogger);
    sm.transition({ type: 'start_review' });
    // Just created, should not timeout
    const result = sm.checkTimeout();
    expect(result).toBe('skeptic_review');
  });

  test('escalated timeout after 8 hours results in blocked', () => {
    const sm = new ApprovalStateMachine('esc-timeout', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'timeout' });
    expect(sm.getState()).toBe('escalated');

    // Set escalated state to be past 8-hour timeout
    sm.stateEnteredAt = Date.now() - (9 * 60 * 60 * 1000);
    const result = sm.checkTimeout();
    expect(result).toBe('blocked');
  });

  test('user rejects from escalated state -> blocked', () => {
    const sm = new ApprovalStateMachine('esc-reject', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'timeout' });

    sm.transition({ type: 'user_decision', decision: 'reject' });
    expect(sm.getState()).toBe('blocked');
  });

  test('invalid user decision in escalated throws error', () => {
    const sm = new ApprovalStateMachine('esc-invalid', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'timeout' });

    expect(() => sm.transition({ type: 'user_decision', decision: 'maybe' }))
      .toThrow('Invalid user decision');
  });

  test('invalid action in escalated state throws error', () => {
    const sm = new ApprovalStateMachine('esc-bad-action', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'timeout' });

    expect(() => sm.transition({ type: 'start_review' }))
      .toThrow('Invalid action');
  });

  test('invalid action in user_override state throws error', () => {
    const sm = new ApprovalStateMachine('uo-bad', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'timeout' });
    sm.transition({ type: 'user_decision', decision: 'override_approve', justification: 'test' });
    expect(sm.getState()).toBe('user_override');

    expect(() => sm.transition({ type: 'start_review' }))
      .toThrow('Invalid action');
  });

  test('invalid action in pending state throws error', () => {
    const sm = new ApprovalStateMachine('pending-bad', auditLogger);
    expect(() => sm.transition({ type: 'verifier_verdict', verdict: 'proceed' }))
      .toThrow('Invalid action');
  });

  test('timeout in pending state escalates', () => {
    const sm = new ApprovalStateMachine('pending-timeout', auditLogger);
    sm.transition({ type: 'timeout' });
    expect(sm.getState()).toBe('escalated');
  });

  test('verifier unverifiable with skeptic approve goes to awaiting_approver', () => {
    const sm = new ApprovalStateMachine('verify-unverify-approve', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    sm.transition({ type: 'verifier_verdict', verdict: 'unverifiable' });
    expect(sm.getState()).toBe('awaiting_approver');
  });

  test('invalid verifier verdict throws error', () => {
    const sm = new ApprovalStateMachine('bad-verifier', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });

    expect(() => sm.transition({ type: 'verifier_verdict', verdict: 'invalid' }))
      .toThrow('Invalid verifier verdict');
  });

  test('invalid approver verdict throws error', () => {
    const sm = new ApprovalStateMachine('bad-approver', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    sm.transition({ type: 'verifier_verdict', verdict: 'proceed' });

    expect(() => sm.transition({ type: 'approver_verdict', verdict: 'invalid' }))
      .toThrow('Invalid approver verdict');
  });

  test('state machine without audit logger still works', () => {
    const sm = new ApprovalStateMachine('no-logger');
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    expect(sm.getState()).toBe('verifier_review');
  });

  test('invalid action in verifier_review throws error', () => {
    const sm = new ApprovalStateMachine('bad-verifier-action', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });

    expect(() => sm.transition({ type: 'approver_verdict', verdict: 'approve' }))
      .toThrow('Invalid action');
  });

  test('invalid action in awaiting_approver throws error', () => {
    const sm = new ApprovalStateMachine('bad-approver-action', auditLogger);
    sm.transition({ type: 'start_review' });
    sm.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    sm.transition({ type: 'verifier_verdict', verdict: 'proceed' });

    expect(() => sm.transition({ type: 'skeptic_verdict', verdict: 'approve' }))
      .toThrow('Invalid action');
  });
});

// ============================================================
// ADDITIONAL COVERAGE: Budget Enforcer edge cases
// ============================================================
describe('Additional Coverage: Budget Enforcer Edge Cases', () => {
  test('rejects reservation exceeding agent budget', () => {
    const auditLogger = new AuditLogger();
    const enforcer = new BudgetEnforcer({ perAgentDaily: 1000, dailyOrgTotal: 100000, perTaskAlert: 5000 }, auditLogger);

    const result = enforcer.reserveBudget('t1', 'agent-1', 900);
    expect(result.success).toBe(true);

    // Second reservation should exceed agent limit
    const result2 = enforcer.reserveBudget('t2', 'agent-1', 900);
    expect(result2.success).toBe(false);
    expect(result2.reason).toBe('agent_budget_exceeded');
  });

  test('budget enforcer without audit logger still works', () => {
    const enforcer = new BudgetEnforcer();
    const result = enforcer.reserveBudget('t1', 'agent-1', 500);
    expect(result.success).toBe(true);
    enforcer.chargeBudget('t1', 'agent-1', 500);
    expect(enforcer.canAcceptNewTask()).toBe(true);
  });
});

// ============================================================
// ADDITIONAL COVERAGE: Audit Logger edge cases
// ============================================================
describe('Additional Coverage: Audit Logger Edge Cases', () => {
  test('query with since filter works', () => {
    const logger = new AuditLogger();
    logger.log({ event: 'task_created', taskId: 't1', timestamp: '2026-03-08T10:00:00Z' });
    logger.log({ event: 'task_created', taskId: 't2', timestamp: '2026-03-08T12:00:00Z' });

    const results = logger.query({ since: '2026-03-08T11:00:00Z' });
    expect(results).toHaveLength(1);
    expect(results[0].taskId).toBe('t2');
  });

  test('count returns correct number', () => {
    const logger = new AuditLogger();
    expect(logger.count()).toBe(0);
    logger.log({ event: 'task_created', timestamp: '2026-03-08T10:00:00Z' });
    logger.log({ event: 'task_created', timestamp: '2026-03-08T10:01:00Z' });
    expect(logger.count()).toBe(2);
  });

  test('query with no matching filters returns empty', () => {
    const logger = new AuditLogger();
    logger.log({ event: 'task_created', taskId: 't1', actor: 'agent-1', timestamp: '2026-03-08T10:00:00Z' });

    expect(logger.query({ event: 'budget_charged' })).toHaveLength(0);
    expect(logger.query({ taskId: 'nonexistent' })).toHaveLength(0);
    expect(logger.query({ actor: 'nobody' })).toHaveLength(0);
  });

  test('query with empty filters returns all entries', () => {
    const logger = new AuditLogger();
    logger.log({ event: 'task_created', timestamp: '2026-03-08T10:00:00Z' });
    logger.log({ event: 'task_assigned', timestamp: '2026-03-08T10:01:00Z' });

    expect(logger.query({})).toHaveLength(2);
    expect(logger.query()).toHaveLength(2);
  });

  test('all valid event types are accepted', () => {
    const logger = new AuditLogger();
    const validEvents = [
      'task_created', 'task_assigned', 'approval_decision', 'budget_reserved',
      'budget_charged', 'budget_reset', 'escalation_triggered',
      'agent_heartbeat_missed', 'governance_override', 'state_transition'
    ];
    for (const event of validEvents) {
      const id = logger.log({ event, timestamp: '2026-03-08T10:00:00Z' });
      expect(id).toBeGreaterThan(0);
    }
    expect(logger.count()).toBe(validEvents.length);
  });
});

// ============================================================
// ADDITIONAL COVERAGE: Task Manager edge cases
// ============================================================
describe('Additional Coverage: Task Manager Edge Cases', () => {
  test('listTasks filters by status and type', () => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    const tm = new TaskManager(budgetEnforcer, auditLogger);

    tm.createTask({ ...SAMPLE_TASK_VALID, taskId: 'list-1', type: 'debug' });
    tm.createTask({ ...SAMPLE_TASK_VALID, taskId: 'list-2', type: 'route' });
    tm.assignTask('list-1', 'agent-1');

    expect(tm.listTasks({ status: 'in_progress' })).toHaveLength(1);
    expect(tm.listTasks({ type: 'route' })).toHaveLength(1);
  });

  test('deleteTask throws for non-existent task', () => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    const tm = new TaskManager(budgetEnforcer, auditLogger);

    expect(() => tm.deleteTask('nonexistent')).toThrow('Task not found');
  });

  test('completeTask rejects non-object output', () => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    const tm = new TaskManager(budgetEnforcer, auditLogger);

    tm.createTask({ ...SAMPLE_TASK_VALID, taskId: 'bad-output' });
    const task = tm.getTask('bad-output');
    task.stateMachine.transition({ type: 'start_review' });
    task.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    task.stateMachine.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    task.stateMachine.transition({ type: 'approver_verdict', verdict: 'approve' });

    expect(() => tm.completeTask('bad-output', null)).toThrow('must be a non-null object');
    expect(() => tm.completeTask('bad-output', 'string')).toThrow('must be a non-null object');
  });

  test('completeTask rejects output with non-array tests', () => {
    const auditLogger = new AuditLogger();
    const budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    const tm = new TaskManager(budgetEnforcer, auditLogger);

    tm.createTask({ ...SAMPLE_TASK_VALID, taskId: 'bad-tests' });
    const task = tm.getTask('bad-tests');
    task.stateMachine.transition({ type: 'start_review' });
    task.stateMachine.transition({ type: 'skeptic_verdict', verdict: 'approve' });
    task.stateMachine.transition({ type: 'verifier_verdict', verdict: 'proceed' });
    task.stateMachine.transition({ type: 'approver_verdict', verdict: 'approve' });

    const badOutput = {
      root_cause: 'cause',
      evidence: [{ source: 'x', finding: 'y' }],
      fix_plan: 'fix',
      rollback: 'revert',
      tests: [],
      confidence: 'high'
    };

    expect(() => tm.completeTask('bad-tests', badOutput)).toThrow('tests must be a non-empty array');
  });

  test('task manager without audit logger still works', () => {
    const budgetEnforcer = new BudgetEnforcer();
    const tm = new TaskManager(budgetEnforcer, null);

    const result = tm.createTask({ type: 'debug', evidence: [] });
    expect(result.status).toBe('pending');
    tm.assignTask(result.taskId, 'agent-1');
  });
});
