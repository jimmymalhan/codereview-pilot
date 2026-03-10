/**
 * Agent Pool Manager
 *
 * Manages pools of agents (100s to 1000s) with health monitoring,
 * load balancing, and automatic recovery.
 *
 * Supports:
 * - Agent registration and lifecycle
 * - Health monitoring with heartbeats
 * - Task distribution (round-robin, least-loaded)
 * - Automatic unhealthy agent recovery
 * - Metrics collection and reporting
 */

export class AgentPool {
  constructor(config = {}) {
    this.maxAgentsPerPool = config.maxAgentsPerPool || 1000;
    this.heartbeatInterval = config.heartbeatInterval || 5000;
    this.agentTimeoutThreshold = config.agentTimeoutThreshold || 30000;

    // Agent registry: { agentId: { id, status, lastHeartbeat, taskCount, ... } }
    this.agents = new Map();

    // Agent task queues: { agentId: [task1, task2, ...] }
    this.taskQueues = new Map();

    // Distribution strategy
    this.distributionStrategy = config.distributionStrategy || 'least-loaded';

    // Metrics
    this.metrics = {
      agentsCreated: 0,
      agentsRetired: 0,
      tasksSubmitted: 0,
      tasksCompleted: 0,
      tasksFailedCount: 0,
      lastHeartbeatCheck: null,
      unhealthyCount: 0
    };

    // Status
    this.status = 'uninitialized';

    // Heartbeat monitor
    this.heartbeatMonitorId = null;
  }

  /**
   * Initialize agent pool and start health monitoring
   */
  async initialize() {
    this.status = 'initializing';

    // Start heartbeat monitor
    this.startHeartbeatMonitor();

    this.status = 'ready';
    return { status: 'ready', maxAgents: this.maxAgentsPerPool };
  }

  /**
   * Register a new agent in the pool
   */
  registerAgent(agentId, agentConfig = {}) {
    if (this.agents.size >= this.maxAgentsPerPool) {
      throw new Error(`Pool capacity exceeded. Max: ${this.maxAgentsPerPool}`);
    }

    const agent = {
      id: agentId,
      status: 'ready',
      lastHeartbeat: Date.now(),
      taskCount: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalLatency: 0,
      config: agentConfig,
      registeredAt: new Date().toISOString()
    };

    this.agents.set(agentId, agent);
    this.taskQueues.set(agentId, []);
    this.metrics.agentsCreated++;

    return { success: true, agent };
  }

  /**
   * Submit task to pool using distribution strategy
   */
  submitTask(task) {
    const healthyAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'ready' && a.taskCount < 100); // Max 100 queued per agent

    if (healthyAgents.length === 0) {
      throw new Error('No healthy agents available in pool');
    }

    // Select agent based on strategy
    let selectedAgent;
    if (this.distributionStrategy === 'round-robin') {
      // Simple round-robin (in production, use atomic counter)
      selectedAgent = healthyAgents[Math.floor(Math.random() * healthyAgents.length)];
    } else {
      // Least-loaded (default)
      selectedAgent = healthyAgents.reduce((prev, curr) =>
        prev.taskCount < curr.taskCount ? prev : curr
      );
    }

    // Add task to agent's queue
    const taskWithMeta = {
      ...task,
      assignedAgent: selectedAgent.id,
      submittedAt: Date.now(),
      status: 'queued'
    };

    this.taskQueues.get(selectedAgent.id).push(taskWithMeta);
    selectedAgent.taskCount++;
    this.metrics.tasksSubmitted++;

    return { success: true, agentId: selectedAgent.id, taskId: task.id };
  }

  /**
   * Report task completion
   */
  completeTask(agentId, taskId, result) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Remove task from queue
    const queue = this.taskQueues.get(agentId);
    const taskIndex = queue.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      const task = queue[taskIndex];
      queue.splice(taskIndex, 1);

      // Update metrics
      agent.taskCount--;
      agent.completedTasks++;
      agent.totalLatency += Date.now() - task.submittedAt;
      this.metrics.tasksCompleted++;
    }

    return { success: true };
  }

  /**
   * Report task failure
   */
  failTask(agentId, taskId, error) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Remove task from queue
    const queue = this.taskQueues.get(agentId);
    const taskIndex = queue.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      queue.splice(taskIndex, 1);
      agent.taskCount--;
      agent.failedTasks++;
      this.metrics.tasksFailedCount++;
    }

    return { success: true, error };
  }

  /**
   * Record agent heartbeat
   */
  heartbeat(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    agent.lastHeartbeat = Date.now();
    agent.status = 'ready';

    return { success: true };
  }

  /**
   * Start health monitoring
   */
  startHeartbeatMonitor() {
    this.heartbeatMonitorId = setInterval(() => {
      this.checkAgentHealth();
    }, this.heartbeatInterval);
  }

  /**
   * Stop health monitoring
   */
  stopHeartbeatMonitor() {
    if (this.heartbeatMonitorId) {
      clearInterval(this.heartbeatMonitorId);
      this.heartbeatMonitorId = null;
    }
  }

  /**
   * Check health of all agents
   */
  checkAgentHealth() {
    const now = Date.now();
    this.metrics.lastHeartbeatCheck = now;
    this.metrics.unhealthyCount = 0;

    for (const [agentId, agent] of this.agents) {
      const timeSinceHeartbeat = now - agent.lastHeartbeat;

      if (timeSinceHeartbeat > this.agentTimeoutThreshold) {
        agent.status = 'unhealthy';
        this.metrics.unhealthyCount++;

        // Redistribute tasks
        const queue = this.taskQueues.get(agentId);
        if (queue.length > 0) {
          for (const task of queue) {
            this.submitTask(task);
          }
          queue.length = 0;
          agent.taskCount = 0;
        }
      }
    }
  }

  /**
   * Retire an unhealthy agent
   */
  retireAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    // Redistribute tasks
    const queue = this.taskQueues.get(agentId);
    if (queue.length > 0) {
      for (const task of queue) {
        this.submitTask(task);
      }
    }

    // Remove agent
    this.agents.delete(agentId);
    this.taskQueues.delete(agentId);
    this.metrics.agentsRetired++;

    return { success: true };
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const agents = Array.from(this.agents.values());
    const healthyAgents = agents.filter(a => a.status === 'ready');
    const avgLatency = agents.length > 0
      ? agents.reduce((sum, a) => sum + (a.totalLatency / (a.completedTasks || 1)), 0) / agents.length
      : 0;

    return {
      totalAgents: agents.length,
      healthyAgents: healthyAgents.length,
      unhealthyAgents: this.metrics.unhealthyCount,
      capacity: `${agents.length}/${this.maxAgentsPerPool}`,
      metrics: {
        tasksSubmitted: this.metrics.tasksSubmitted,
        tasksCompleted: this.metrics.tasksCompleted,
        tasksFailed: this.metrics.tasksFailedCount,
        successRate: this.metrics.tasksCompleted / (this.metrics.tasksSubmitted || 1),
        avgLatencyMs: Math.round(avgLatency),
        agentsCreated: this.metrics.agentsCreated,
        agentsRetired: this.metrics.agentsRetired
      },
      agents: agents.map(a => ({
        id: a.id,
        status: a.status,
        taskCount: a.taskCount,
        completedTasks: a.completedTasks,
        failedTasks: a.failedTasks,
        avgLatencyMs: Math.round(a.totalLatency / (a.completedTasks || 1))
      }))
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.stopHeartbeatMonitor();

    // Redistribute remaining tasks
    for (const [agentId, queue] of this.taskQueues) {
      for (const task of queue) {
        // Log unprocessed task
        console.warn(`Unprocessed task ${task.id} from agent ${agentId}`);
      }
    }

    this.status = 'shutdown';
    return { status: 'shutdown' };
  }
}

/**
 * Factory function for easy instantiation
 */
export function createAgentPool(config) {
  return new AgentPool(config);
}
