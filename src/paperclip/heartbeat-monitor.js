/**
 * Heartbeat Monitor for Paperclip Integration
 *
 * Monitors agent health via periodic heartbeats.
 * Implements Phase 2.6 heartbeat specification.
 */

const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds
const HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes (4 missed beats)
const MAX_MISSED_BEFORE_UNAVAILABLE = 4;

export class HeartbeatMonitor {
  constructor(auditLogger = null) {
    this.agents = {}; // { agentId: { lastBeat, missedCount, status, tasksInFlight } }
    this.auditLogger = auditLogger;
    this.escalations = [];
  }

  registerAgent(agentId) {
    this.agents[agentId] = {
      lastBeat: Date.now(),
      missedCount: 0,
      status: 'healthy',
      tasksInFlight: 0
    };
  }

  receiveHeartbeat(agentId, payload = {}) {
    if (!this.agents[agentId]) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    this.agents[agentId].lastBeat = Date.now();
    this.agents[agentId].missedCount = 0;
    this.agents[agentId].status = payload.status || 'healthy';
    this.agents[agentId].tasksInFlight = payload.tasksInFlight || 0;

    return { acknowledged: true };
  }

  checkAgents(now = Date.now()) {
    const results = [];

    for (const [agentId, agent] of Object.entries(this.agents)) {
      if (agent.status === 'unavailable') {
        results.push({ agentId, status: 'unavailable', missedCount: agent.missedCount });
        continue;
      }

      const elapsed = now - agent.lastBeat;
      const missedBeats = Math.floor(elapsed / HEARTBEAT_INTERVAL_MS);

      if (missedBeats > agent.missedCount) {
        agent.missedCount = missedBeats;

        if (missedBeats >= MAX_MISSED_BEFORE_UNAVAILABLE) {
          agent.status = 'unavailable';
          this._escalate(agentId, 'circuit_breaker', `Agent missed ${missedBeats} heartbeats, marked unavailable`);
        } else if (missedBeats >= 3) {
          agent.status = 'failing';
          this._escalate(agentId, 'kill_tasks', `Agent missed ${missedBeats} heartbeats`);
        } else if (missedBeats >= 2) {
          agent.status = 'degraded';
          this._escalate(agentId, 'alert_ops', `Agent missed ${missedBeats} heartbeats`);
        } else if (missedBeats >= 1) {
          this._logWarning(agentId, `Missed ${missedBeats} heartbeat(s)`);
        }
      }

      results.push({ agentId, status: agent.status, missedCount: agent.missedCount });
    }

    return results;
  }

  getAgentStatus(agentId) {
    if (!this.agents[agentId]) {
      return null;
    }
    return { ...this.agents[agentId] };
  }

  getEscalations() {
    return [...this.escalations];
  }

  isAvailable(agentId) {
    const agent = this.agents[agentId];
    return agent && agent.status !== 'unavailable';
  }

  _escalate(agentId, action, reason) {
    const escalation = {
      agentId,
      action,
      reason,
      timestamp: new Date().toISOString()
    };
    this.escalations.push(escalation);

    if (this.auditLogger) {
      this.auditLogger.log({
        event: 'agent_heartbeat_missed',
        agentId,
        action,
        reason,
        timestamp: new Date().toISOString()
      });
    }
  }

  _logWarning(agentId, message) {
    if (this.auditLogger) {
      this.auditLogger.log({
        event: 'agent_heartbeat_missed',
        agentId,
        severity: 'warning',
        message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

export { HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS, MAX_MISSED_BEFORE_UNAVAILABLE };
