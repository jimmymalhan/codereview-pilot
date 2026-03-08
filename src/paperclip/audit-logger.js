/**
 * Audit Logger for Paperclip Integration
 *
 * Immutable, append-only audit trail with mandatory fields.
 * Implements Phase 2.8 audit logging specification.
 */

const REQUIRED_FIELDS = ['event', 'timestamp'];

const VALID_EVENTS = [
  'task_created',
  'task_assigned',
  'approval_decision',
  'budget_reserved',
  'budget_charged',
  'budget_reset',
  'escalation_triggered',
  'agent_heartbeat_missed',
  'governance_override',
  'state_transition'
];

export class AuditLogger {
  constructor() {
    this._entries = [];
    this._sealed = false;
  }

  log(entry) {
    if (this._sealed) {
      throw new Error('Audit log is sealed and cannot accept new entries');
    }

    this._validateEntry(entry);

    const record = {
      ...entry,
      id: this._entries.length + 1,
      loggedAt: new Date().toISOString()
    };

    // Append-only: freeze the record to prevent mutation
    Object.freeze(record);
    this._entries.push(record);

    return record.id;
  }

  query(filters = {}) {
    let results = [...this._entries];

    if (filters.event) {
      results = results.filter(e => e.event === filters.event);
    }
    if (filters.taskId) {
      results = results.filter(e => e.taskId === filters.taskId);
    }
    if (filters.actor) {
      results = results.filter(e => e.actor === filters.actor);
    }
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      results = results.filter(e => new Date(e.timestamp) >= sinceDate);
    }

    return results;
  }

  getAll() {
    return [...this._entries];
  }

  count() {
    return this._entries.length;
  }

  seal() {
    this._sealed = true;
  }

  verifyIntegrity() {
    // Check sequential IDs with no gaps
    for (let i = 0; i < this._entries.length; i++) {
      if (this._entries[i].id !== i + 1) {
        return { valid: false, error: `Gap detected at position ${i}: expected id ${i + 1}, got ${this._entries[i].id}` };
      }
    }

    // Check all entries are frozen
    for (const entry of this._entries) {
      if (!Object.isFrozen(entry)) {
        return { valid: false, error: `Entry ${entry.id} is not immutable` };
      }
    }

    return { valid: true, entryCount: this._entries.length };
  }

  _validateEntry(entry) {
    for (const field of REQUIRED_FIELDS) {
      if (!entry[field]) {
        throw new Error(`Audit entry missing required field: ${field}`);
      }
    }

    if (!VALID_EVENTS.includes(entry.event)) {
      throw new Error(`Invalid audit event type: ${entry.event}. Valid types: ${VALID_EVENTS.join(', ')}`);
    }
  }
}

export { REQUIRED_FIELDS, VALID_EVENTS };
