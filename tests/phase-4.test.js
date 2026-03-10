/**
 * Phase 4 Advanced Features Tests
 *
 * Monitoring, Performance, Extended Framework, Security, Reporting
 */

import { jest } from '@jest/globals';
import { MonitoringDashboard } from '../src/orchestrator/monitoring-dashboard.js';
import { PerformanceOptimizer } from '../src/orchestrator/performance-optimizer.js';
import { ExtendedAgentFramework } from '../src/orchestrator/extended-agent-framework.js';
import { AuditLogger } from '../src/orchestrator/audit-logger.js';
import { TaskManager } from '../src/orchestrator/task-manager.js';
import { BudgetEnforcer } from '../src/orchestrator/budget-enforcer.js';
import { HeartbeatMonitor } from '../src/orchestrator/heartbeat-monitor.js';

describe('Phase 4: Advanced Features Tests', () => {
  let dashboard, optimizer, framework, auditLogger, taskManager, budgetEnforcer, monitor;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    budgetEnforcer = new BudgetEnforcer({}, auditLogger);
    taskManager = new TaskManager(budgetEnforcer, auditLogger);
    monitor = new HeartbeatMonitor(auditLogger);
    dashboard = new MonitoringDashboard(taskManager, budgetEnforcer, auditLogger, monitor);
    optimizer = new PerformanceOptimizer();
    framework = new ExtendedAgentFramework();
  });

  describe('Monitoring Dashboard (Ticket 4.1)', () => {
    test('should get real-time dashboard', () => {
      const dashboard_data = dashboard.getRealTimeDashboard();
      expect(dashboard_data.timestamp).toBeDefined();
      expect(dashboard_data.systemHealth).toBeDefined();
      expect(dashboard_data.taskMetrics).toBeDefined();
      expect(dashboard_data.agentPerformance).toBeDefined();
      expect(dashboard_data.budgetStatus).toBeDefined();
    });

    test('should provide system health metrics', () => {
      const health = dashboard._getSystemHealth();
      expect(health.status).toBe('healthy');
      expect(health.activeAgents).toBeGreaterThanOrEqual(0);
    });

    test('should track task metrics', () => {
      const metrics = dashboard._getTaskMetrics();
      expect(metrics.total).toBeDefined();
      expect(metrics.successRate).toBeDefined();
    });

    test('should generate performance report', () => {
      const report = dashboard.generatePerformanceReport();
      expect(report.reportDate).toBeDefined();
      expect(report.dashboard).toBeDefined();
      expect(report.recommendations).toEqual(expect.any(Array));
    });
  });

  describe('Performance Optimizer (Ticket 4.2)', () => {
    test('should execute with caching', () => {
      const result = optimizer.executeWithCache('key1', () => ({ data: 'test' }));
      expect(result.data).toBe('test');
    });

    test('should track cache hits', () => {
      optimizer.executeWithCache('key2', () => ({ data: 'value' }));
      optimizer.executeWithCache('key2', () => ({ data: 'new' })); // Should hit cache

      const stats = optimizer.getCacheStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    test('should optimize task execution', () => {
      const task = { type: 'debug', evidence: [1, 2, 3, 4, 5] };
      const result = optimizer.optimizeTaskExecution(task);
      expect(result.optimized).toBeDefined();
      expect(result.optimized.priority).toBeDefined();
    });

    test('should provide performance metrics', () => {
      const metrics = optimizer.getMetrics();
      expect(metrics.caching).toBeDefined();
      expect(metrics.optimizations).toBeDefined();
    });
  });

  describe('Extended Agent Framework (Ticket 4.3)', () => {
    test('should initialize with 8 agents', () => {
      const agents = framework.getAllAgents();
      expect(agents.length).toBe(8);
    });

    test('should include base 4 agents', () => {
      const agents = framework.getAllAgents();
      const agentIds = agents.map(a => a.id);
      expect(agentIds).toContain('router');
      expect(agentIds).toContain('retriever');
      expect(agentIds).toContain('skeptic');
      expect(agentIds).toContain('verifier');
    });

    test('should include extended 4 agents', () => {
      const agents = framework.getAllAgents();
      const agentIds = agents.map(a => a.id);
      expect(agentIds).toContain('analyst');
      expect(agentIds).toContain('executor');
      expect(agentIds).toContain('monitor');
      expect(agentIds).toContain('coordinator');
    });

    test('should provide capability matrix', () => {
      const capabilities = framework.getCapabilities('router');
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
    });

    test('should register plugins', () => {
      const plugin = { execute: () => 'result' };
      const result = framework.registerPlugin('router', 'custom-plugin', plugin);
      expect(result.status).toBe('registered');
    });

    test('should load custom agents', () => {
      const config = { name: 'custom-agent', capabilities: { read: ['src/**'], write: [] } };
      const result = framework.loadCustomAgent('custom-1', config);
      expect(result.status).toBe('loaded');
      expect(result.agentId).toBe('custom-1');
    });

    test('should get full capability matrix', () => {
      const matrix = framework.getCapabilityMatrix();
      expect(Object.keys(matrix).length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Phase 4 Integration', () => {
    test('should coordinate all Phase 4 components', () => {
      // Dashboard monitors
      const dashboard_data = dashboard.getRealTimeDashboard();
      expect(dashboard_data).toBeDefined();

      // Optimizer improves performance
      const optimized = optimizer.optimizeTaskExecution({ type: 'debug', evidence: [] });
      expect(optimized).toBeDefined();

      // Framework extends capabilities
      const agents = framework.getAllAgents();
      expect(agents.length).toBe(8);
    });

    test('should maintain backward compatibility', () => {
      // All 4 base agents should still work
      const baseAgents = ['router', 'retriever', 'skeptic', 'verifier'];
      baseAgents.forEach(agentId => {
        const agent = framework.agents.get(agentId);
        expect(agent).toBeDefined();
        expect(agent.id).toBe(agentId);
      });
    });
  });

  describe('Phase 4 Coverage', () => {
    test('monitoring dashboard should track all metrics', () => {
      const dashboard_data = dashboard.getRealTimeDashboard();
      expect(dashboard_data).toHaveProperty('systemHealth');
      expect(dashboard_data).toHaveProperty('taskMetrics');
      expect(dashboard_data).toHaveProperty('agentPerformance');
      expect(dashboard_data).toHaveProperty('budgetStatus');
      expect(dashboard_data).toHaveProperty('auditMetrics');
    });

    test('optimizer should handle edge cases', () => {
      optimizer.clearCache();
      expect(optimizer.getCacheStats().cacheSize).toBe(0);
    });

    test('framework should support dynamic agent loading', () => {
      const initialCount = framework.getAllAgents().length;
      framework.loadCustomAgent('dynamic-1', {});
      framework.loadCustomAgent('dynamic-2', {});
      const finalCount = framework.getAllAgents().length;
      expect(finalCount).toBeGreaterThan(initialCount);
    });
  });
});
