/**
 * Agent Fleet Orchestrator
 *
 * Manages multiple agent pool instances (orchestrators) across a cluster
 * to support 10,000+ concurrent agents.
 *
 * Features:
 * - Multi-instance coordination
 * - Load balancing across instances
 * - Health monitoring per instance
 * - Distributed task submission
 * - Agent registry synchronization
 * - Metrics aggregation
 */

export class AgentFleet {
  constructor(config = {}) {
    // Fleet configuration
    this.minInstances = config.minInstances || 1;
    this.maxInstances = config.maxInstances || 100;
    this.agentsPerInstance = config.agentsPerInstance || 1000;

    // Scaling thresholds
    this.scaleUpThreshold = config.scaleUpThreshold || 0.8;     // 80% capacity
    this.scaleDownThreshold = config.scaleDownThreshold || 0.2; // 20% capacity

    // Orchestrator instances: { instanceId: { id, status, url, agentCount, ... } }
    this.instances = new Map();

    // Agent registry: { agentId: { id, instanceId, status, ... } }
    this.agentRegistry = new Map();

    // Task routing: { taskId: instanceId }
    this.taskRouting = new Map();

    // Status
    this.status = 'uninitialized';

    // Metrics
    this.metrics = {
      totalAgents: 0,
      totalTasks: 0,
      totalTasksCompleted: 0,
      totalFailures: 0,
      lastScalingAction: null,
      instanceCreatedCount: 0,
      instanceRemovedCount: 0
    };

    // Auto-scaling monitor
    this.autoScalingMonitorId = null;
  }

  /**
   * Initialize the fleet
   */
  async initialize(instances = []) {
    this.status = 'initializing';

    // Register initial instances
    for (const instance of instances) {
      this.registerInstance(instance);
    }

    // If no instances provided, create minimum
    if (this.instances.size === 0) {
      for (let i = 0; i < this.minInstances; i++) {
        this.createInstance(`instance-${i}`);
      }
    }

    // Start auto-scaling monitor
    this.startAutoScalingMonitor();

    this.status = 'ready';
    return { status: 'ready', instances: this.instances.size };
  }

  /**
   * Register an orchestrator instance
   */
  registerInstance(config) {
    const instanceId = config.id || `instance-${Date.now()}`;

    if (this.instances.has(instanceId)) {
      throw new Error(`Instance ${instanceId} already registered`);
    }

    const instance = {
      id: instanceId,
      status: 'ready',
      url: config.url || `http://localhost:${3000 + this.instances.size}`,
      agentCount: 0,
      taskCount: 0,
      completedTasks: 0,
      failedTasks: 0,
      lastHeartbeat: Date.now(),
      registeredAt: new Date().toISOString()
    };

    this.instances.set(instanceId, instance);
    this.metrics.instanceCreatedCount++;

    return { success: true, instance };
  }

  /**
   * Create a new orchestrator instance
   */
  createInstance(instanceId) {
    if (this.instances.size >= this.maxInstances) {
      throw new Error(`Cannot create instance. Max instances (${this.maxInstances}) reached`);
    }

    return this.registerInstance({
      id: instanceId,
      url: `http://localhost:${3000 + this.instances.size}`
    });
  }

  /**
   * Register agent with fleet (assign to instance)
   */
  registerAgent(agentId, instanceId = null) {
    // Find best instance if not specified
    if (!instanceId) {
      instanceId = this.selectBestInstance();
    }

    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    // Check capacity
    if (instance.agentCount >= this.agentsPerInstance) {
      throw new Error(`Instance ${instanceId} is at capacity`);
    }

    const agent = {
      id: agentId,
      instanceId,
      status: 'ready',
      registeredAt: new Date().toISOString()
    };

    this.agentRegistry.set(agentId, agent);
    instance.agentCount++;
    this.metrics.totalAgents++;

    return { success: true, agent, instanceId };
  }

  /**
   * Submit task to fleet (route to best instance)
   */
  submitTask(task) {
    const healthyInstances = Array.from(this.instances.values())
      .filter(i => i.status === 'ready' && i.taskCount < 10000);

    if (healthyInstances.length === 0) {
      throw new Error('No healthy instances available');
    }

    // Select instance with least load
    const selectedInstance = healthyInstances.reduce((prev, curr) =>
      prev.taskCount < curr.taskCount ? prev : curr
    );

    // Route task to instance
    this.taskRouting.set(task.id, selectedInstance.id);
    selectedInstance.taskCount++;
    this.metrics.totalTasks++;

    return {
      success: true,
      taskId: task.id,
      instanceId: selectedInstance.id,
      url: selectedInstance.url
    };
  }

  /**
   * Report task completion across fleet
   */
  completeTask(taskId, instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    instance.taskCount--;
    instance.completedTasks++;
    this.metrics.totalTasksCompleted++;
    this.taskRouting.delete(taskId);

    return { success: true };
  }

  /**
   * Report task failure
   */
  failTask(taskId, instanceId, error) {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    instance.taskCount--;
    instance.failedTasks++;
    this.metrics.totalFailures++;

    return { success: true };
  }

  /**
   * Record instance heartbeat
   */
  heartbeat(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    instance.lastHeartbeat = Date.now();
    instance.status = 'ready';

    return { success: true };
  }

  /**
   * Check health of all instances
   */
  checkInstanceHealth() {
    const now = Date.now();

    for (const [instanceId, instance] of this.instances) {
      const timeSinceHeartbeat = now - instance.lastHeartbeat;

      if (timeSinceHeartbeat > 30000) {
        instance.status = 'unhealthy';

        // Redistribute tasks from unhealthy instance
        for (const [taskId, assignedInstanceId] of this.taskRouting) {
          if (assignedInstanceId === instanceId) {
            this.taskRouting.set(taskId, null); // Mark for redistribution
          }
        }
      }
    }
  }

  /**
   * Select best instance for new agent (least loaded)
   */
  selectBestInstance() {
    const readyInstances = Array.from(this.instances.values())
      .filter(i => i.status === 'ready' && i.agentCount < this.agentsPerInstance);

    if (readyInstances.length === 0) {
      throw new Error('No healthy instances with capacity');
    }

    return readyInstances.reduce((prev, curr) =>
      prev.agentCount < curr.agentCount ? prev : curr
    ).id;
  }

  /**
   * Start auto-scaling monitor
   */
  startAutoScalingMonitor() {
    this.autoScalingMonitorId = setInterval(() => {
      this.checkAutoScalingNeeds();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check if scaling is needed
   */
  checkAutoScalingNeeds() {
    const utilizationRate = this.metrics.totalAgents / (this.instances.size * this.agentsPerInstance);

    // Scale up if utilization is high
    if (utilizationRate > this.scaleUpThreshold && this.instances.size < this.maxInstances) {
      this.createInstance(`instance-${Date.now()}`);
      this.metrics.lastScalingAction = { action: 'scale-up', timestamp: Date.now() };
    }

    // Scale down if utilization is low
    if (utilizationRate < this.scaleDownThreshold && this.instances.size > this.minInstances) {
      const leastLoadedInstance = Array.from(this.instances.values())
        .filter(i => i.agentCount === 0) // Only remove if no agents
        .sort((a, b) => a.agentCount - b.agentCount)[0];

      if (leastLoadedInstance) {
        this.removeInstance(leastLoadedInstance.id);
        this.metrics.lastScalingAction = { action: 'scale-down', timestamp: Date.now() };
      }
    }
  }

  /**
   * Remove an instance from the fleet
   */
  removeInstance(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    // Redistribute agents
    for (const [agentId, agent] of this.agentRegistry) {
      if (agent.instanceId === instanceId) {
        const newInstanceId = this.selectBestInstance();
        agent.instanceId = newInstanceId;
      }
    }

    // Redistribute tasks
    for (const [taskId, assignedInstanceId] of this.taskRouting) {
      if (assignedInstanceId === instanceId) {
        this.taskRouting.set(taskId, null);
      }
    }

    this.instances.delete(instanceId);
    this.metrics.instanceRemovedCount++;

    return { success: true };
  }

  /**
   * Get fleet statistics
   */
  getFleetStats() {
    const instances = Array.from(this.instances.values());
    const healthyInstances = instances.filter(i => i.status === 'ready');

    const totalCapacity = this.instances.size * this.agentsPerInstance;
    const utilizationRate = this.metrics.totalAgents / totalCapacity;

    return {
      instances: {
        total: this.instances.size,
        healthy: healthyInstances.length,
        capacity: totalCapacity
      },
      agents: {
        total: this.metrics.totalAgents,
        utilizationRate: Math.round(utilizationRate * 100) + '%'
      },
      tasks: {
        submitted: this.metrics.totalTasks,
        completed: this.metrics.totalTasksCompleted,
        failed: this.metrics.totalFailures,
        successRate: (this.metrics.totalTasksCompleted / (this.metrics.totalTasks || 1) * 100).toFixed(2) + '%'
      },
      scaling: {
        lastAction: this.metrics.lastScalingAction,
        minInstances: this.minInstances,
        maxInstances: this.maxInstances
      },
      instances: instances.map(i => ({
        id: i.id,
        status: i.status,
        url: i.url,
        agents: i.agentCount,
        tasks: i.taskCount,
        completed: i.completedTasks,
        failed: i.failedTasks
      }))
    };
  }

  /**
   * Stop auto-scaling monitor and shutdown
   */
  async shutdown() {
    if (this.autoScalingMonitorId) {
      clearInterval(this.autoScalingMonitorId);
    }

    this.status = 'shutdown';
    return { status: 'shutdown' };
  }
}

/**
 * Factory function
 */
export function createAgentFleet(config) {
  return new AgentFleet(config);
}
