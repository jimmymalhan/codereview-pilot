/**
 * Budget Enforcement Module for Debug Copilot Orchestration
 *
 * Enforces token budgets per-agent, per-incident, and org-wide.
 * Implements Phase 2.7 budget specification.
 */

const DEFAULT_LIMITS = {
  perAgentDaily: 10000,
  perIncident: 50000,
  dailyOrgTotal: 100000,
  perTaskAlert: 5000
};

const ALERT_THRESHOLDS = {
  warning: 0.75,
  escalate: 0.90,
  hardStop: 1.0
};

export class BudgetEnforcer {
  constructor(limits = DEFAULT_LIMITS, auditLogger = null) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    this.auditLogger = auditLogger;
    this.usage = {
      agents: {},    // { agentId: { daily: number, reserved: number } }
      incidents: {}, // { incidentId: number }
      orgDaily: 0,
      orgReserved: 0
    };
    this.alerts = [];
  }

  getUsage() {
    return JSON.parse(JSON.stringify(this.usage));
  }

  getAlerts() {
    return [...this.alerts];
  }

  enforceLimit(agentId, taskId, estimatedTokens) {
    return this.reserveBudget(taskId, agentId, estimatedTokens);
  }

  reserveBudget(taskId, agentId, estimatedTokens) {
    const agentUsage = this._getAgentUsage(agentId);
    const concurrentAgents = Object.keys(this.usage.agents).length || 1;
    const adjustedAgentLimit = this.limits.perAgentDaily / concurrentAgents;

    // Check org-wide daily limit
    if (this.usage.orgDaily + this.usage.orgReserved + estimatedTokens > this.limits.dailyOrgTotal) {
      this._emitAlert('hard_stop', `Org daily budget exceeded for task ${taskId}`);
      return { success: false, reason: 'org_budget_exceeded' };
    }

    // Check per-agent daily limit
    if (agentUsage.daily + agentUsage.reserved + estimatedTokens > adjustedAgentLimit) {
      this._emitAlert('escalate', `Agent ${agentId} budget exceeded for task ${taskId}`);
      return { success: false, reason: 'agent_budget_exceeded' };
    }

    // Check per-task alert threshold
    if (estimatedTokens > this.limits.perTaskAlert) {
      this._emitAlert('warning', `Task ${taskId} estimated ${estimatedTokens} tokens exceeds per-task alert threshold`);
      return { success: false, reason: 'requires_pre_approval' };
    }

    // Reserve
    agentUsage.reserved += estimatedTokens;
    this.usage.orgReserved += estimatedTokens;

    this._logAudit('budget_reserved', { taskId, agentId, tokens: estimatedTokens });
    return { success: true, reserved: estimatedTokens };
  }

  chargeBudget(taskId, agentId, actualTokens) {
    const agentUsage = this._getAgentUsage(agentId);

    // Move from reserved to actual
    agentUsage.reserved = Math.max(0, agentUsage.reserved - actualTokens);
    agentUsage.daily += actualTokens;

    this.usage.orgReserved = Math.max(0, this.usage.orgReserved - actualTokens);
    this.usage.orgDaily += actualTokens;

    // Check threshold alerts
    const orgRatio = this.usage.orgDaily / this.limits.dailyOrgTotal;
    if (orgRatio >= ALERT_THRESHOLDS.hardStop) {
      this._emitAlert('hard_stop', 'Org daily budget 100% consumed');
    } else if (orgRatio >= ALERT_THRESHOLDS.escalate) {
      this._emitAlert('escalate', `Org daily budget at ${Math.round(orgRatio * 100)}%`);
    } else if (orgRatio >= ALERT_THRESHOLDS.warning) {
      this._emitAlert('warning', `Org daily budget at ${Math.round(orgRatio * 100)}%`);
    }

    this._logAudit('budget_charged', { taskId, agentId, tokens: actualTokens });
    return { success: true, charged: actualTokens, orgRemaining: this.limits.dailyOrgTotal - this.usage.orgDaily };
  }

  canAcceptNewTask() {
    return this.usage.orgDaily < this.limits.dailyOrgTotal;
  }

  resetDaily() {
    for (const agentId of Object.keys(this.usage.agents)) {
      this.usage.agents[agentId].daily = 0;
      this.usage.agents[agentId].reserved = 0;
    }
    this.usage.orgDaily = 0;
    this.usage.orgReserved = 0;
    this.alerts = [];
    this._logAudit('budget_reset', { timestamp: new Date().toISOString() });
  }

  _getAgentUsage(agentId) {
    if (!this.usage.agents[agentId]) {
      this.usage.agents[agentId] = { daily: 0, reserved: 0 };
    }
    return this.usage.agents[agentId];
  }

  _emitAlert(severity, message) {
    this.alerts.push({
      severity,
      message,
      timestamp: new Date().toISOString()
    });
  }

  _logAudit(event, data) {
    if (this.auditLogger) {
      this.auditLogger.log({ event, ...data, timestamp: new Date().toISOString() });
    }
  }
}

export { DEFAULT_LIMITS, ALERT_THRESHOLDS };
