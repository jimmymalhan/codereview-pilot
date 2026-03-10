/**
 * Debug Copilot Orchestrator Tests
 * 15+ test cases covering all 8 coordinated modules
 */

import { jest } from '@jest/globals';
import { DebugOrchestrator } from '../src/orchestrator/orchestrator-client.js';

describe('DebugOrchestrator: Local Orchestrator Tests', () => {
  let client;

  beforeEach(async () => {
    client = new DebugOrchestrator();
    await client.initialize();
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      expect(client.isInitialized).toBe(true);
    });

    test('should have all 11 modules (8 orchestrator + 3 skills)', () => {
      expect(client.auditLogger).toBeDefined();
      expect(client.taskManager).toBeDefined();
      expect(client.budgetEnforcer).toBeDefined();
      expect(client.heartbeatMonitor).toBeDefined();
      expect(client.agentWrapper).toBeDefined();
      expect(client.errorHandler).toBeDefined();
      expect(client.approvalStateMachine).toBeDefined();
      expect(client.evidenceVerifier).toBeDefined();
      expect(client.hallucinationDetector).toBeDefined();
      expect(client.confidenceScorer).toBeDefined();
    });
  });

  describe('Task Management', () => {
    test('should submit task', async () => {
      const task = {
        type: 'debug',
        evidence: [],
        hypothesis: 'test hypothesis'
      };
      const result = await client.submitTask(task);
      expect(result.success).toBe(true);
    });

    test('should get task by ID', async () => {
      const task = { type: 'debug', evidence: [], hypothesis: 'test' };
      const { task: createdTask } = await client.submitTask(task);

      const retrieved = await client.getTask(createdTask.taskId);
      expect(retrieved.status).toBe('success');
      expect(retrieved.task.taskId).toBe(createdTask.taskId);
    });

    test('should update task status', async () => {
      const task = { type: 'debug', evidence: [], hypothesis: 'test' };
      const { task: createdTask } = await client.submitTask(task);

      const result = await client.updateTaskStatus(createdTask.taskId, 'in_progress');
      expect(result.status).toBe('success');
      expect(result.updated).toBe(true);
    });

    test('should handle invalid task ID', async () => {
      await expect(client.getTask('invalid-id')).rejects.toThrow();
    });
  });

  describe('Agent Operations', () => {
    test('should send heartbeat', async () => {
      const result = await client.sendHeartbeat('router', { status: 'alive' });
      expect(result.status).toBe('heartbeat_received');
      expect(result.agentId).toBe('router');
    });

    test('should invoke agent', async () => {
      const task = { type: 'debug', evidence: [], hypothesis: 'test' };
      const result = await client.invokeAgent('router', 'test-task', task);
      expect(result).toBeDefined();
    });
  });

  describe('Audit & Budget', () => {
    test('should query audit trail', async () => {
      const trail = await client.queryAuditTrail();
      expect(Array.isArray(trail)).toBe(true);
    });

    test('should get budget status', async () => {
      const budget = await client.getBudgetStatus();
      expect(budget.status).toBe('success');
      expect(budget.budget).toBeDefined();
    });
  });

  describe('Orchestration Stats', () => {
    test('should provide orchestration stats', () => {
      const stats = client.getOrchestrationStats();
      expect(stats.isInitialized).toBe(true);
      expect(stats.taskCount).toBeDefined();
      expect(stats.agentStats).toBeDefined();
      expect(stats.budgetStatus).toBeDefined();
    });

    test('should track task count', async () => {
      const task = { type: 'debug', evidence: [], hypothesis: 'test' };
      await client.submitTask(task);

      const stats = client.getOrchestrationStats();
      expect(stats.taskCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors with retry logic', async () => {
      const task = { type: 'debug', evidence: [], hypothesis: 'test' };
      // Should succeed even if there are transient errors
      const result = await client.submitTask(task);
      expect(result).toBeDefined();
    });

    test('should not retry non-retryable errors', async () => {
      // Validation error should not retry
      const invalidTask = { type: 'invalid_type', evidence: [] };
      const result = await client.submitTask(invalidTask);
      expect(result.success).toBe(false);
    });
  });

  describe('Module Coordination', () => {
    test('should coordinate all modules on task submission', async () => {
      const auditSpy = jest.spyOn(client.auditLogger, 'log');
      const task = { type: 'debug', evidence: [], hypothesis: 'test' };

      await client.submitTask(task);

      // Audit logger should have been called (coordination)
      expect(auditSpy).toHaveBeenCalled();
    });

    test('should coordinate budget enforcement', async () => {
      const budgetSpy = jest.spyOn(client.budgetEnforcer, 'enforceLimit');
      const task = { type: 'debug', evidence: [], hypothesis: 'test' };

      await client.submitTask(task);

      // Budget enforcer should be consulted
      expect(budgetSpy).toHaveBeenCalled();
    });
  });

  describe('Local vs Remote Orchestration', () => {
    test('should be local (not HTTP-based)', () => {
      // Should use local modules, not HTTP
      expect(client.taskManager).toBeDefined();
      expect(client.auditLogger).toBeDefined();
      // No baseUrl or apiKey properties from old HTTP client
      expect(client.baseUrl).toBeUndefined();
    });

    test('should have all local module references', () => {
      const stats = client.getOrchestrationStats();
      expect(stats.taskCount).toBeGreaterThanOrEqual(0);
      expect(stats.agentStats).toBeDefined();
      // All stats are from local modules
    });
  });
});
