// Test setup file
require('dotenv').config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(10000);

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

