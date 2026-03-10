/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/run.js',
    '!src/www/**',
    '!src/custom-agents/performance-optimizer.js',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    },
    './src/orchestrator/approval-state-machine.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/orchestrator/budget-enforcer.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/orchestrator/audit-logger.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/website.test.js',
    '<rootDir>/tests/e2e/performance.test.js',
    '<rootDir>/tests/e2e/user-journeys.test.js',
    '<rootDir>/tests/agent-scaling.test.js',
    '<rootDir>/tests/ui-validation.test.js',
    '<rootDir>/tests/components/app-framework.test.js',
    '<rootDir>/tests/integration/workflows.test.js',
    '<rootDir>/tests/unit/design-tokens.test.js',
    '<rootDir>/tests/unit/motion-utils.test.js'
  ],
  verbose: true
};
