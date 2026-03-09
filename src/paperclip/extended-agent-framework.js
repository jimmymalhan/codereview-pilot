/**
 * Extended Agent Framework (Phase 4, Ticket 4.3)
 *
 * Support for 8 agent roles, plugin system, capability matrix, dynamic loading
 */

export class ExtendedAgentFramework {
  constructor() {
    this.agents = new Map();
    this.plugins = new Map();
    this.capabilityMatrix = new Map();

    this._initializeBaseAgents();
  }

  /**
   * Initialize base 4 agents + 4 extended agents
   */
  _initializeBaseAgents() {
    const baseAgents = ['router', 'retriever', 'skeptic', 'verifier'];
    const extendedAgents = ['analyst', 'executor', 'monitor', 'coordinator'];

    [...baseAgents, ...extendedAgents].forEach(agentId => {
      this.agents.set(agentId, {
        id: agentId,
        status: 'ready',
        capabilities: this._getCapabilities(agentId),
        loadedAt: new Date().toISOString()
      });

      this.capabilityMatrix.set(agentId, {
        read: this._getReadCapabilities(agentId),
        write: this._getWriteCapabilities(agentId),
        execute: this._getExecuteCapabilities(agentId)
      });
    });
  }

  /**
   * Register plugin for agent
   */
  registerPlugin(agentId, pluginName, plugin) {
    if (!this.agents.has(agentId)) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const key = `${agentId}:${pluginName}`;
    this.plugins.set(key, {
      name: pluginName,
      agent: agentId,
      plugin,
      registeredAt: new Date().toISOString()
    });

    return { status: 'registered', key };
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent capabilities
   */
  getAgentCapabilities(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Unknown agent: ${agentId}`);
    return this.capabilityMatrix.get(agentId);
  }

  /**
   * Get capabilities (alias for getAgentCapabilities)
   */
  getCapabilities(agentId) {
    const capabilities = this.getAgentCapabilities(agentId);
    // Return as array for compatibility
    return Object.values(capabilities).flat();
  }

  /**
   * Load custom agent dynamically
   */
  loadCustomAgent(agentId, config) {
    this.agents.set(agentId, {
      id: agentId,
      status: 'custom',
      config,
      loadedAt: new Date().toISOString()
    });

    this.capabilityMatrix.set(agentId, {
      read: config.capabilities?.read || [],
      write: config.capabilities?.write || [],
      execute: config.capabilities?.execute || []
    });

    return { status: 'loaded', agentId };
  }

  /**
   * Get capability matrix for all agents
   */
  getCapabilityMatrix() {
    const matrix = {};
    this.agents.forEach((agent, agentId) => {
      matrix[agentId] = this.capabilityMatrix.get(agentId);
    });
    return matrix;
  }

  /**
   * Internal: Get capabilities
   */
  _getCapabilities(agentId) {
    const capabilities = {
      router: ['classify', 'route', 'analyze'],
      retriever: ['fetch', 'search', 'aggregate'],
      skeptic: ['challenge', 'verify', 'critique'],
      verifier: ['validate', 'confirm', 'sign-off'],
      analyst: ['analyze', 'report', 'trend'],
      executor: ['execute', 'deploy', 'rollback'],
      monitor: ['observe', 'alert', 'health-check'],
      coordinator: ['orchestrate', 'sequence', 'coordinate']
    };
    return capabilities[agentId] || [];
  }

  /**
   * Internal: Get read capabilities
   */
  _getReadCapabilities(agentId) {
    const capabilities = {
      router: ['src/**', 'logs/**'],
      retriever: ['src/**', '*.json', '*.md'],
      skeptic: ['.paperclip/task-outputs/**'],
      verifier: ['.paperclip/task-outputs/**', '.claude/**'],
      analyst: ['src/**', 'logs/**', '.paperclip/**'],
      executor: ['.paperclip/**', 'src/**'],
      monitor: ['.paperclip/**', 'logs/**'],
      coordinator: ['.paperclip/**', 'src/**']
    };
    return capabilities[agentId] || [];
  }

  /**
   * Internal: Get write capabilities
   */
  _getWriteCapabilities(agentId) {
    const capabilities = {
      router: [],
      retriever: [],
      skeptic: ['.paperclip/skeptic-output.json'],
      verifier: ['.paperclip/verifier-output.json'],
      analyst: ['.paperclip/reports/**'],
      executor: ['.paperclip/task-state/**'],
      monitor: ['.paperclip/metrics/**'],
      coordinator: ['.paperclip/coordination/**']
    };
    return capabilities[agentId] || [];
  }

  /**
   * Internal: Get execute capabilities
   */
  _getExecuteCapabilities(agentId) {
    const capabilities = {
      router: ['classify', 'route'],
      retriever: ['fetch'],
      skeptic: ['review'],
      verifier: ['validate'],
      analyst: ['analyze'],
      executor: ['execute'],
      monitor: ['check'],
      coordinator: ['orchestrate']
    };
    return capabilities[agentId] || [];
  }
}

export default ExtendedAgentFramework;
