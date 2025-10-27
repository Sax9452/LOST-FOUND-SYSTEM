module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage paths to ignore
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/__tests__/',
    '/coverage/'
  ],

  // Collect coverage from
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/uploads/**',
    '!backend/logs/**',
    '!backend/database/**',
    '!backend/server.js',
    '!backend/config/**'
  ],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000
};

