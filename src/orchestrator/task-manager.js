/**
 * Task Manager for Debug Copilot Orchestration
 *
 * Manages task lifecycle: creation, validation, routing, and completion.
 * Enforces CLAUDE.md output contract on task completion.
 */

import { ApprovalStateMachine } from './approval-state-machine.js';

const VALID_TASK_TYPES = ['debug', 'verify', 'route', 'report'];

const REQUIRED_OUTPUT_FIELDS = [
  'root_cause',
  'evidence',
  'fix_plan',
  'rollback',
  'tests',
  'confidence'
];

const VALID_CONFIDENCE_LEVELS = ['high', 'medium', 'low'];

const VALID_FAILURE_CLASSES = [
  'schema_drift',
  'write_conflict',
  'stale_read',
  'bad_deploy',
  'auth_failure',
  'dependency_break'
];

export class TaskManager {
  constructor(budgetEnforcer, auditLogger) {
    this.tasks = new Map();
    this.budgetEnforcer = budgetEnforcer;
    this.auditLogger = auditLogger;
  }

  createTask(taskInput) {
    this._validateTaskInput(taskInput);

    const taskId = taskInput.taskId || this._generateId();
    const task = {
      taskId,
      type: taskInput.type,
      status: 'pending',
      input: {
        evidence: taskInput.evidence || [],
        hypothesis: taskInput.hypothesis || '',
        constraints: taskInput.constraints || []
      },
      output: null,
      approvals: {
        skeptic: null,
        verifier: null,
        approver: null
      },
      governance: {
        state: 'pending',
        budget_reserved: 0,
        budget_spent: 0,
        escalations: []
      },
      stateMachine: new ApprovalStateMachine(taskId, this.auditLogger),
      createdAt: new Date().toISOString()
    };

    this.tasks.set(taskId, task);

    if (this.auditLogger) {
      this.auditLogger.log({
        event: 'task_created',
        taskId,
        taskType: task.type,
        timestamp: new Date().toISOString()
      });
    }

    return { taskId, status: 'pending' };
  }

  getTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return task;
  }

  assignTask(taskId, agentId) {
    const task = this.getTask(taskId);
    task.assignedTo = agentId;
    task.status = 'in_progress';

    if (this.auditLogger) {
      this.auditLogger.log({
        event: 'task_assigned',
        taskId,
        agentId,
        timestamp: new Date().toISOString()
      });
    }

    return { taskId, assignedTo: agentId, status: 'in_progress' };
  }

  routeTask(taskId, classification) {
    if (!VALID_FAILURE_CLASSES.includes(classification)) {
      throw new Error(`Invalid failure classification: ${classification}. Valid: ${VALID_FAILURE_CLASSES.join(', ')}`);
    }

    const task = this.getTask(taskId);
    task.classification = classification;

    return { taskId, classification };
  }

  completeTask(taskId, output) {
    const task = this.getTask(taskId);

    // Enforce: task must be approved before completion
    if (task.stateMachine.getState() !== 'approved') {
      throw new Error(`Task ${taskId} cannot be completed: approval state is '${task.stateMachine.getState()}', must be 'approved'`);
    }

    // Enforce CLAUDE.md output contract
    this._validateOutput(output);

    task.output = output;
    task.status = 'completed';
    task.completedAt = new Date().toISOString();

    return { taskId, status: 'completed' };
  }

  deleteTask(taskId) {
    if (!this.tasks.has(taskId)) {
      throw new Error(`Task not found: ${taskId}`);
    }
    this.tasks.delete(taskId);
    return { taskId, deleted: true };
  }

  listTasks(filter = {}) {
    let tasks = [...this.tasks.values()];
    if (filter.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }
    if (filter.type) {
      tasks = tasks.filter(t => t.type === filter.type);
    }
    return tasks.map(t => ({
      taskId: t.taskId,
      type: t.type,
      status: t.status,
      state: t.stateMachine.getState()
    }));
  }

  _validateTaskInput(input) {
    if (!input.type || !VALID_TASK_TYPES.includes(input.type)) {
      throw new Error(`Invalid task type: ${input.type}. Valid types: ${VALID_TASK_TYPES.join(', ')}`);
    }
  }

  _validateOutput(output) {
    if (!output || typeof output !== 'object') {
      throw new Error('Task output must be a non-null object');
    }

    for (const field of REQUIRED_OUTPUT_FIELDS) {
      if (output[field] === undefined || output[field] === null || output[field] === '') {
        throw new Error(`Task output missing required field: ${field}`);
      }
    }

    // evidence and tests must be non-empty arrays
    if (!Array.isArray(output.evidence) || output.evidence.length === 0) {
      throw new Error('Task output.evidence must be a non-empty array');
    }
    if (!Array.isArray(output.tests) || output.tests.length === 0) {
      throw new Error('Task output.tests must be a non-empty array');
    }

    // confidence must be valid
    if (!VALID_CONFIDENCE_LEVELS.includes(output.confidence)) {
      throw new Error(`Invalid confidence level: ${output.confidence}. Valid: ${VALID_CONFIDENCE_LEVELS.join(', ')}`);
    }
  }

  _generateId() {
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export { VALID_TASK_TYPES, REQUIRED_OUTPUT_FIELDS, VALID_CONFIDENCE_LEVELS, VALID_FAILURE_CLASSES };
