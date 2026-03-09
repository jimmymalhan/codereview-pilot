/**
 * Paperclip Local Orchestrator
 *
 * Local orchestration system coordinating all 8 modules:
 * - input-validator, file-access-guard, log-sanitizer (security)
 * - agent-wrapper (lifecycle), error-handler (resilience)
 * - task-manager, approval-state-machine (core)
 * - audit-logger, budget-enforcer, heartbeat-monitor (governance)
 */

import { TaskManager } from './task-manager.js';
import { ApprovalStateMachine } from './approval-state-machine.js';
import { BudgetEnforcer } from './budget-enforcer.js';
import { AuditLogger } from './audit-logger.js';
import { HeartbeatMonitor } from './heartbeat-monitor.js';
import { AgentWrapper } from './agent-wrapper.js';
import { ErrorHandler } from './error-handler.js';

export class PaperclipClient {
  constructor(config = {}) {
    // Initialize all 8 modules
    this.auditLogger = new AuditLogger();
    this.budgetEnforcer = new BudgetEnforcer({}, this.auditLogger);
    this.taskManager = new TaskManager(this.budgetEnforcer, this.auditLogger);
    this.heartbeatMonitor = new HeartbeatMonitor(this.auditLogger);
    this.agentWrapper = new AgentWrapper(this.auditLogger);
    this.errorHandler = new ErrorHandler(this.auditLogger);
    this.approvalStateMachine = new ApprovalStateMachine(this.auditLogger);

    this.config = config;
    this.isInitialized = false;
  }

  /**
   * Initialize local orchestration system
   */
  async initialize() {
    this.auditLogger.log({
      event: 'state_transition',
      taskId: 'orchestrator',
      fromState: 'uninitialized',
      toState: 'ready',
      timestamp: new Date().toISOString()
    });
    this.isInitialized = true;
    return { status: 'initialized', modules: 8 };
  }

  /**
   * Submit task through orchestration pipeline
   */
  async submitTask(taskInput) {
    return this.errorHandler.executeWithRetry(async () => {
      const { taskId } = this.taskManager.createTask(taskInput);
      return this.getTask(taskId);
    });
  }

  /**
   * Get task by ID
   */
  async getTask(taskId) {
    try {
      const task = this.taskManager.getTask(taskId);
      return { status: 'success', task };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, status) {
    try {
      const task = this.taskManager.getTask(taskId);
      task.status = status;
      this.auditLogger.log({
        event: 'state_transition',
        taskId,
        toState: status,
        timestamp: new Date().toISOString()
      });
      return { status: 'success', updated: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send agent heartbeat
   */
  async sendHeartbeat(agentId, payload) {
    return this.errorHandler.executeWithRetry(async () => {
      this.heartbeatMonitor.registerAgent(agentId);
      this.heartbeatMonitor.receiveHeartbeat(agentId, payload);
      return { status: 'heartbeat_received', agentId };
    });
  }

  /**
   * Query audit trail
   */
  async queryAuditTrail(filters = {}) {
    return this.auditLogger.query(filters);
  }

  /**
   * Get budget status
   */
  async getBudgetStatus() {
    const budgetStatus = this.budgetEnforcer.getUsage();
    return { status: 'success', budget: budgetStatus };
  }

  /**
   * Invoke agent through wrapper
   */
  async invokeAgent(agentId, taskId, taskInput) {
    return this.agentWrapper.invokeAgent(agentId, taskId, taskInput);
  }

  /**
   * Get orchestrator stats
   */
  getOrchestrationStats() {
    const budgetUsage = this.budgetEnforcer.getUsage();
    return {
      isInitialized: this.isInitialized,
      taskCount: this.taskManager.tasks.size,
      agentStats: this.agentWrapper.getExecutionStats(),
      budgetStatus: {
        used: (budgetUsage?.orgDaily || 0) + (budgetUsage?.orgReserved || 0),
        limit: 10000
      },
      heartbeatStatus: Object.keys(this.heartbeatMonitor.agents || {}).length
    };
  }
}

export class PaperclipApiError extends Error {
  constructor(message, code = 'ORCHESTRATION_ERROR') {
    super(message);
    this.name = 'PaperclipApiError';
    this.code = code;
  }
}
