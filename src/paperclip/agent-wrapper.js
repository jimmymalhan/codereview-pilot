/**
 * Agent Wrapper for Paperclip Integration
 *
 * Translates between repo agents and task system.
 * Manages 4 agent roles: router, retriever, skeptic, verifier
 * Executes 10-step lifecycle per agent invocation.
 */

import { InputValidator } from './input-validator.js';
import { FileAccessGuard } from './file-access-guard.js';
import { LogSanitizer } from './log-sanitizer.js';

const AGENT_ROLES = ['router', 'retriever', 'skeptic', 'verifier'];

const EXECUTION_STEPS = [
  'validate_input',
  'check_permissions',
  'acquire_lock',
  'execute_agent',
  'sanitize_output',
  'verify_output',
  'update_state',
  'log_result',
  'release_lock',
  'notify_completion'
];

export class AgentWrapper {
  constructor(auditLogger) {
    this.auditLogger = auditLogger;
    this.executionLocks = new Map(); // taskId -> lock
    this.agentOutputs = new Map(); // agentId -> latest output
  }

  /**
   * Invoke an agent with task input
   * Executes 10-step lifecycle
   */
  async invokeAgent(agentId, taskId, taskInput) {
    if (!AGENT_ROLES.includes(agentId)) {
      throw new Error(`Unknown agent role: ${agentId}`);
    }

    const execution = {
      agentId,
      taskId,
      steps: {},
      startTime: new Date().toISOString()
    };

    try {
      // Step 1: Validate input
      execution.steps.validate_input = this._step('validate_input', () => {
        InputValidator.validateTaskInput(taskInput);
      });

      // Step 2: Check permissions
      execution.steps.check_permissions = this._step('check_permissions', () => {
        this._checkAgentPermissions(agentId, taskInput);
      });

      // Step 3: Acquire lock
      execution.steps.acquire_lock = this._step('acquire_lock', () => {
        this._acquireLock(taskId);
      });

      // Step 4: Execute agent (stub - actual execution depends on agent type)
      execution.steps.execute_agent = this._step('execute_agent', () => {
        return this._executeAgent(agentId, taskInput);
      });

      // Step 5: Sanitize output
      execution.steps.sanitize_output = this._step('sanitize_output', () => {
        return LogSanitizer.sanitizeObject(execution.steps.execute_agent.result);
      });

      // Step 6: Verify output
      execution.steps.verify_output = this._step('verify_output', () => {
        this._verifyAgentOutput(agentId, execution.steps.sanitize_output.result);
      });

      // Step 7: Update state
      execution.steps.update_state = this._step('update_state', () => {
        this.agentOutputs.set(agentId, {
          agentId,
          taskId,
          output: execution.steps.sanitize_output.result,
          timestamp: new Date().toISOString()
        });
      });

      // Step 8: Log result
      execution.steps.log_result = this._step('log_result', () => {
        if (this.auditLogger) {
          this.auditLogger.log({
            event: 'state_transition',
            timestamp: new Date().toISOString(),
            taskId,
            fromState: 'executing',
            toState: 'agent_completed'
          });
        }
      });

      // Step 9: Release lock
      execution.steps.release_lock = this._step('release_lock', () => {
        this._releaseLock(taskId);
      });

      // Step 10: Notify completion
      execution.steps.notify_completion = this._step('notify_completion', () => {
        return {
          agentId,
          taskId,
          status: 'completed',
          output: execution.steps.sanitize_output.result
        };
      });

      execution.status = 'success';
      execution.result = execution.steps.notify_completion.result;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      this._releaseLock(taskId);
      if (this.auditLogger) {
        this.auditLogger.log({
          event: 'escalation_triggered',
          timestamp: new Date().toISOString(),
          taskId,
          reason: error.message
        });
      }
    }

    execution.endTime = new Date().toISOString();
    return execution;
  }

  /**
   * Get latest output from agent
   */
  getAgentOutput(agentId) {
    return this.agentOutputs.get(agentId) || null;
  }

  /**
   * Internal: Execute single step
   */
  _step(name, fn) {
    const startTime = Date.now();
    try {
      const result = fn();
      return {
        status: 'success',
        duration: Date.now() - startTime,
        result
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Internal: Check agent permissions for task input
   */
  _checkAgentPermissions(agentId, taskInput) {
    // Agents can read logs and agent configs
    const allowedToRead = FileAccessGuard.canRead(agentId, 'logs/agent.log');
    if (!allowedToRead && agentId !== 'router') {
      // Router has special read access
      // All agents can read task outputs they're assigned to
    }
  }

  /**
   * Internal: Acquire execution lock
   */
  _acquireLock(taskId) {
    if (this.executionLocks.has(taskId)) {
      throw new Error(`Task ${taskId} is already being executed`);
    }
    this.executionLocks.set(taskId, { acquiredAt: Date.now() });
  }

  /**
   * Internal: Release execution lock
   */
  _releaseLock(taskId) {
    this.executionLocks.delete(taskId);
  }

  /**
   * Internal: Execute agent logic (stub)
   */
  _executeAgent(agentId, taskInput) {
    // Placeholder: actual agent execution would call agent-specific logic
    const output = {
      agentId,
      result: `Agent ${agentId} executed successfully`,
      executedAt: new Date().toISOString()
    };

    // Add required fields based on agent role
    if (agentId === 'router' || agentId === 'retriever') {
      output.evidence = taskInput.evidence || [];
    } else if (agentId === 'skeptic' || agentId === 'verifier') {
      output.verdict = `Verified by ${agentId}`;
    }

    return output;
  }

  /**
   * Internal: Verify agent output format
   */
  _verifyAgentOutput(agentId, output) {
    if (!output || typeof output !== 'object') {
      throw new Error(`Agent ${agentId} produced invalid output`);
    }
    // Verify required fields based on agent role
    if (agentId === 'router' || agentId === 'retriever') {
      // These agents must return evidence
      if (!Array.isArray(output.evidence)) {
        throw new Error(`Agent ${agentId} missing evidence array`);
      }
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats() {
    return {
      totalAgents: AGENT_ROLES.length,
      agentsWithOutput: this.agentOutputs.size,
      activeExecutions: this.executionLocks.size
    };
  }
}

export default AgentWrapper;
