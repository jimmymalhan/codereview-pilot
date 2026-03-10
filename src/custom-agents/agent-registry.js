/**
 * AgentRegistry - Registration, discovery, and lifecycle management for custom agents.
 *
 * Provides a central registry for all custom agents with support for:
 * - Agent registration and deregistration
 * - Discovery by name or capability
 * - Lifecycle management (start, stop, health checks)
 * - Agent chaining for complex workflows
 * - Execution history tracking
 */

import { BaseAgent } from './base-agent.js';

export class AgentRegistry {
  constructor() {
    /** @type {Map<string, BaseAgent>} */
    this._agents = new Map();

    /** @type {Array<object>} */
    this._executionHistory = [];

    /** @type {number} */
    this._maxHistorySize = 1000;
  }

  /**
   * Register an agent instance.
   *
   * @param {BaseAgent} agent - Agent to register
   * @throws {Error} If agent is not a BaseAgent or name is taken
   */
  register(agent) {
    if (!(agent instanceof BaseAgent)) {
      throw new Error('Agent must be an instance of BaseAgent');
    }

    if (this._agents.has(agent.name)) {
      throw new Error(`Agent '${agent.name}' is already registered`);
    }

    this._agents.set(agent.name, agent);
  }

  /**
   * Deregister an agent by name.
   *
   * @param {string} name - Agent name to remove
   * @returns {boolean} Whether the agent was found and removed
   */
  deregister(name) {
    if (!this._agents.has(name)) {
      return false;
    }

    const agent = this._agents.get(name);
    if (agent.state === 'running') {
      throw new Error(`Cannot deregister agent '${name}' while it is running`);
    }

    this._agents.delete(name);
    return true;
  }

  /**
   * Get an agent by name.
   *
   * @param {string} name - Agent name
   * @returns {BaseAgent|undefined}
   */
  get(name) {
    return this._agents.get(name);
  }

  /**
   * Check if an agent is registered.
   *
   * @param {string} name - Agent name
   * @returns {boolean}
   */
  has(name) {
    return this._agents.has(name);
  }

  /**
   * List all registered agents with their descriptions.
   *
   * @returns {object[]} Array of agent descriptors
   */
  list() {
    return Array.from(this._agents.values()).map(agent => agent.describe());
  }

  /**
   * Find agents by capability.
   *
   * @param {string} capability - Capability to search for
   * @returns {BaseAgent[]} Matching agents
   */
  findByCapability(capability) {
    const results = [];
    for (const agent of this._agents.values()) {
      if (agent.capabilities.includes(capability)) {
        results.push(agent);
      }
    }
    return results;
  }

  /**
   * Run a single agent by name.
   *
   * @param {string} name - Agent name
   * @param {object} input - Agent input
   * @returns {Promise<object>} Agent result
   * @throws {Error} If agent not found
   */
  async run(name, input) {
    const agent = this._agents.get(name);
    if (!agent) {
      throw new Error(`Agent '${name}' not found in registry`);
    }

    const result = await agent.run(input);

    this._recordExecution(name, input, result, null);

    return result;
  }

  /**
   * Chain multiple agents in sequence, passing output from one to the next.
   *
   * @param {Array<{name: string, input?: object, transform?: function}>} steps
   *   Each step has an agent name, optional initial input, and an optional
   *   transform function that maps previous result to next agent's input.
   * @returns {Promise<object>} Final chain result with all intermediate results
   */
  async chain(steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Chain requires at least one step');
    }

    const results = [];
    let previousResult = null;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const agent = this._agents.get(step.name);

      if (!agent) {
        throw new Error(`Agent '${step.name}' not found at step ${i}`);
      }

      let input;
      if (i === 0) {
        input = step.input;
      } else if (step.transform) {
        input = step.transform(previousResult);
      } else {
        input = step.input || previousResult?.result;
      }

      try {
        const result = await agent.run(input);
        results.push({ step: i, agent: step.name, result });
        previousResult = result;
        this._recordExecution(step.name, input, result, null);
      } catch (error) {
        this._recordExecution(step.name, input, null, error.message);
        throw new Error(`Chain failed at step ${i} (${step.name}): ${error.message}`);
      }
    }

    return {
      chainId: `chain-${Date.now()}`,
      steps: results,
      finalResult: previousResult
    };
  }

  /**
   * Run multiple agents in parallel.
   *
   * @param {Array<{name: string, input: object}>} tasks - Agents to run
   * @returns {Promise<object[]>} Array of results
   */
  async parallel(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('Parallel execution requires at least one task');
    }

    const promises = tasks.map(async (task) => {
      const agent = this._agents.get(task.name);
      if (!agent) {
        throw new Error(`Agent '${task.name}' not found`);
      }

      try {
        const result = await agent.run(task.input);
        this._recordExecution(task.name, task.input, result, null);
        return { agent: task.name, status: 'success', result };
      } catch (error) {
        this._recordExecution(task.name, task.input, null, error.message);
        return { agent: task.name, status: 'error', error: error.message };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Get health status of all registered agents.
   *
   * @returns {object} Health report
   */
  health() {
    const agents = {};
    for (const [name, agent] of this._agents) {
      agents[name] = {
        state: agent.state,
        version: agent.version,
        lastRunDuration: agent._lastRunDuration
      };
    }

    return {
      totalAgents: this._agents.size,
      agents,
      executionCount: this._executionHistory.length
    };
  }

  /**
   * Get execution history, optionally filtered by agent name.
   *
   * @param {string} [agentName] - Filter by agent name
   * @param {number} [limit=50] - Max entries to return
   * @returns {object[]} Execution history entries
   */
  getHistory(agentName, limit = 50) {
    let history = this._executionHistory;

    if (agentName) {
      history = history.filter(h => h.agent === agentName);
    }

    return history.slice(-limit);
  }

  /**
   * Reset all agents to idle state.
   */
  resetAll() {
    for (const agent of this._agents.values()) {
      if (agent.state !== 'running') {
        agent.state = 'idle';
      }
    }
  }

  /**
   * Get the number of registered agents.
   *
   * @returns {number}
   */
  get size() {
    return this._agents.size;
  }

  /**
   * Record an execution in history.
   *
   * @param {string} agent - Agent name
   * @param {object} input - Input provided
   * @param {object|null} result - Result or null on error
   * @param {string|null} error - Error message or null on success
   * @private
   */
  _recordExecution(agent, input, result, error) {
    this._executionHistory.push({
      agent,
      timestamp: new Date().toISOString(),
      success: error === null,
      duration: result?.duration || 0,
      error
    });

    if (this._executionHistory.length > this._maxHistorySize) {
      this._executionHistory = this._executionHistory.slice(-this._maxHistorySize);
    }
  }
}

export default AgentRegistry;
