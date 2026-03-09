/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/run.js',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    },
    './src/paperclip/approval-state-machine.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/paperclip/budget-enforcer.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/paperclip/audit-logger.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  verbose: true
};
