/**
 * Mock Paperclip API for offline testing.
 *
 * Simulates Paperclip API responses for task submission,
 * audit queries, heartbeat, and budget.
 */

export class MockPaperclipApi {
  constructor(options = {}) {
    this.tasks = new Map();
    this.auditEntries = [];
    this.heartbeats = new Map();
    this.budget = { daily: 0, limit: options.dailyLimit || 100000 };
    this.shouldFail = options.shouldFail || false;
    this.failStatus = options.failStatus || 500;
    this.failMessage = options.failMessage || 'Internal Server Error';
    this.latencyMs = options.latencyMs || 0;
  }

  async submitTask(task) {
    await this._maybeDelay();
    this._maybeThrow('POST', '/tasks');

    if (!task.type) {
      throw new MockApiError(400, 'Missing required field: type', '/tasks');
    }

    const taskId = task.taskId || `mock-${Date.now()}`;
    this.tasks.set(taskId, { ...task, taskId, status: 'pending', createdAt: new Date().toISOString() });
    return { taskId, status: 'pending' };
  }

  async getTask(taskId) {
    await this._maybeDelay();
    this._maybeThrow('GET', `/tasks/${taskId}`);

    const task = this.tasks.get(taskId);
    if (!task) {
      throw new MockApiError(404, `Task not found: ${taskId}`, `/tasks/${taskId}`);
    }
    return task;
  }

  async updateTaskStatus(taskId, status) {
    await this._maybeDelay();
    this._maybeThrow('PATCH', `/tasks/${taskId}`);

    const task = this.tasks.get(taskId);
    if (!task) {
      throw new MockApiError(404, `Task not found: ${taskId}`, `/tasks/${taskId}`);
    }
    task.status = status;
    return { taskId, status };
  }

  async sendHeartbeat(agentId, payload) {
    await this._maybeDelay();
    this._maybeThrow('POST', `/agents/${agentId}/heartbeat`);

    this.heartbeats.set(agentId, { ...payload, receivedAt: new Date().toISOString() });
    return { acknowledged: true };
  }

  async queryAuditTrail(filters = {}) {
    await this._maybeDelay();
    this._maybeThrow('GET', '/audit');

    let results = [...this.auditEntries];
    if (filters.taskId) {
      results = results.filter(e => e.taskId === filters.taskId);
    }
    if (filters.event) {
      results = results.filter(e => e.event === filters.event);
    }
    return { entries: results, total: results.length };
  }

  async getBudgetStatus() {
    await this._maybeDelay();
    this._maybeThrow('GET', '/budget');

    return {
      daily: this.budget.daily,
      limit: this.budget.limit,
      remaining: this.budget.limit - this.budget.daily,
      percentage: Math.round((this.budget.daily / this.budget.limit) * 100)
    };
  }

  // Test helpers
  addAuditEntry(entry) {
    this.auditEntries.push({ ...entry, loggedAt: new Date().toISOString() });
  }

  setFailMode(shouldFail, status = 500, message = 'Internal Server Error') {
    this.shouldFail = shouldFail;
    this.failStatus = status;
    this.failMessage = message;
  }

  reset() {
    this.tasks.clear();
    this.auditEntries = [];
    this.heartbeats.clear();
    this.budget.daily = 0;
    this.shouldFail = false;
  }

  async _maybeDelay() {
    if (this.latencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.latencyMs));
    }
  }

  _maybeThrow(method, path) {
    if (this.shouldFail) {
      throw new MockApiError(this.failStatus, this.failMessage, path);
    }
  }
}

export class MockApiError extends Error {
  constructor(status, body, path) {
    super(`Mock API error ${status} on ${path}: ${body}`);
    this.name = 'PaperclipApiError';
    this.status = status;
    this.body = body;
    this.path = path;
  }
}
