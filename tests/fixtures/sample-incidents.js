/**
 * Test fixtures: sample incidents and expected outputs for integration tests.
 */

export const SAMPLE_TASK_VALID = {
  taskId: 'test-task-001',
  type: 'debug',
  evidence: [
    { source: 'logs/api-server.log', line: 'ERROR: column "user_id" does not exist', timestamp: '2026-03-08T10:00:00Z' },
    { source: 'migrations/003_add_user_id.sql', line: 'ALTER TABLE orders ADD COLUMN user_id INTEGER', timestamp: '2026-03-08T09:55:00Z' }
  ],
  hypothesis: 'Schema migration 003 was not applied to production database',
  constraints: ['no invented fields', 'evidence required', 'verifier must approve']
};

export const SAMPLE_TASK_ROUTE = {
  taskId: 'test-task-002',
  type: 'route',
  evidence: [
    { source: 'logs/deploy.log', line: 'Deployment failed: container health check timeout', timestamp: '2026-03-08T11:00:00Z' }
  ],
  hypothesis: 'Bad deployment caused service outage',
  constraints: []
};

export const SAMPLE_TASK_INVALID_TYPE = {
  taskId: 'test-task-003',
  type: 'invalid_type',
  evidence: [],
  hypothesis: 'test'
};

export const SAMPLE_TASK_NO_TYPE = {
  taskId: 'test-task-004',
  evidence: [],
  hypothesis: 'test'
};

export const SAMPLE_OUTPUT_VALID = {
  root_cause: 'Schema migration 003 was not applied to production database, causing column "user_id" to be missing from orders table',
  evidence: [
    { source: 'logs/api-server.log', finding: 'column "user_id" does not exist error at 10:00 UTC' },
    { source: 'migrations/003_add_user_id.sql', finding: 'Migration adds user_id column but was not executed' }
  ],
  fix_plan: 'Apply migration 003 to production database using: psql -f migrations/003_add_user_id.sql',
  rollback: 'Revert migration: ALTER TABLE orders DROP COLUMN user_id; Restore from backup if needed',
  tests: [
    'Verify user_id column exists: SELECT column_name FROM information_schema.columns WHERE table_name=\'orders\'',
    'Run API smoke test: POST /api/orders with user_id field'
  ],
  confidence: 'high'
};

export const SAMPLE_OUTPUT_MISSING_ROOT_CAUSE = {
  evidence: [{ source: 'test', finding: 'test' }],
  fix_plan: 'fix something',
  rollback: 'revert something',
  tests: ['test something'],
  confidence: 'medium'
};

export const SAMPLE_OUTPUT_EMPTY_EVIDENCE = {
  root_cause: 'Some cause',
  evidence: [],
  fix_plan: 'fix something',
  rollback: 'revert something',
  tests: ['test something'],
  confidence: 'medium'
};

export const SAMPLE_OUTPUT_INVALID_CONFIDENCE = {
  root_cause: 'Some cause',
  evidence: [{ source: 'test', finding: 'test' }],
  fix_plan: 'fix something',
  rollback: 'revert something',
  tests: ['test something'],
  confidence: 'very_high'
};

export const SAMPLE_OUTPUT_INVENTED_FIELDS = {
  root_cause: 'The frobnicator API in us-west-4 region returned error from nonexistent_table',
  evidence: [{ source: 'invented_log.txt', finding: 'made up evidence' }],
  fix_plan: 'Fix the frobnicator',
  rollback: 'Revert frobnicator changes',
  tests: ['Test frobnicator'],
  confidence: 'high'
};
