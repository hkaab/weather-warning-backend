import { getLogger, AppLogger } from '../src/utils/logger'; // Adjust path as necessary
import  config   from '../src/config/config'; // Adjust config path
import { format, transports, addColors, Logger as WinstonBaseLogger } from 'winston';
// Import createLogger as a jest.Mock type for proper typing of .mock property
import type { LoggerOptions, Logger as WinstonLoggerType } from 'winston';
const createLogger: jest.Mock<WinstonLoggerType, [LoggerOptions?]> = require('winston').createLogger;
import DailyRotateFile from 'winston-daily-rotate-file';

// --- Mock Winston and its dependencies ---
// We need to mock Winston to test our singleton logger in isolation.
// This prevents actual file writes or console logs during tests.

// Mock Winston's createLogger and transports
jest.mock('winston', () => {
  // Store the actual Winston logger for some internal checks if needed,
  // but primarily mock its behavior.
  let mockWinstonLogger: any;

  // Mock transports (Console, DailyRotateFile)
  const mockConsoleTransport = jest.fn(() => ({
    level: '', format: {}, handleExceptions: false,
    log: jest.fn(),
    close: jest.fn(() => Promise.resolve()) // Mock close for graceful shutdown tests
  }));
  const mockDailyRotateFile = jest.fn(() => ({
    level: '', filename: '', dirname: '', datePattern: '', zippedArchive: false, maxSize: '', maxFiles: '', format: {}, handleExceptions: false,
    log: jest.fn(),
    close: jest.fn(() => Promise.resolve()) // Mock close for graceful shutdown tests
  }));

  const mockTransports = {
    Console: mockConsoleTransport,
    DailyRotateFile: mockDailyRotateFile, // Use the mock for DailyRotateFile
  };

  // Mock format methods
  const mockFormat = {
    combine: jest.fn((...args) => args), // Return args to check format composition
    colorize: jest.fn(() => 'colorize-format'),
    timestamp: jest.fn(() => 'timestamp-format'),
    printf: jest.fn(() => 'printf-format'),
    json: jest.fn(() => 'json-format'),
    errors: jest.fn(() => 'errors-format'),
    splat: jest.fn(() => 'splat-format'),
  };

  // Mock addColors
  const mockAddColors = jest.fn();

  // Mock createLogger
  const mockCreateLogger = jest.fn((options) => {
    // This mock needs to behave like a Winston logger for testing purposes
    // We'll mimic some Winston logger methods for testing
    mockWinstonLogger = {
      levels: options.levels,
      transports: options.transports,
      exceptionHandlers: options.exceptionHandlers,
      rejectionHandlers: options.rejectionHandlers,
      exitOnError: options.exitOnError,
      // Mock log methods (info, error, debug etc.)
      info: jest.fn((message, meta) => {
        // Simulate Winston calling its transports' log method
        options.transports.forEach((t: any) => {
          if (t.log && t.level === 'info') t.log({ level: 'info', message, ...meta });
        });
        return mockWinstonLogger; // Allow chaining
      }),
      error: jest.fn((message, meta) => {
        options.transports.forEach((t: any) => {
          if (t.log && (t.level === 'error' || options.levels.error <= options.levels.info)) t.log({ level: 'error', message, ...meta });
        });
        return mockWinstonLogger;
      }),
      debug: jest.fn((message, meta) => {
        options.transports.forEach((t: any) => {
          if (t.log && t.level === 'debug') t.log({ level: 'debug', message, ...meta });
        });
        return mockWinstonLogger;
      }),
      child: jest.fn((defaultMetadata) => {
        // Simulate a child logger by returning a new mock logger with merged metadata
        return {
          ...mockWinstonLogger, // inherit methods
          defaultMeta: defaultMetadata,
          // You might need to mock log methods specifically for child if testing complex child behavior
        };
      }),
      on: jest.fn((event, cb) => {
        if (event === 'finish') {
          // Simulate finish event for shutdown tests
          setTimeout(cb, 10);
        }
      }),
      end: jest.fn(), // Mock end method
    };
    return mockWinstonLogger;
  });

  return {
    createLogger: mockCreateLogger,
    format: mockFormat,
    transports: mockTransports,
    addColors: mockAddColors,
  };
});

// Mock winston-daily-rotate-file directly as it's imported as a class
jest.mock('winston-daily-rotate-file', () => {
  const MockDailyRotateFile = jest.fn(() => ({
    // Mimic the interface of DailyRotateFile transport
    level: 'info',
    filename: 'mock-file-%DATE%.log',
    dirname: './mock-logs',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: {},
    handleExceptions: false,
    log: jest.fn(),
    close: jest.fn(() => Promise.resolve()),
  }));
  return MockDailyRotateFile;
});


// Mock the config module
jest.mock('../src/config/config', () => ({
  log: {
    level: 'debug',
    file: {
      enabled: true,
      directory: './test-logs',
      fileName: 'test-app-%DATE%.log',
      maxSize: '10m',
      maxFiles: '7d',
    },
  },
  environment: 'test',
  port: 3000,
}));

// --- Test Suite ---

describe('Singleton Winston Logger', () => {
  // Before each test, reset mocks and re-import getLogger
  // This ensures a fresh singleton state for each test
  let logger: AppLogger;
  let WinstonLoggerInstance: any; // To access the mock Winston logger's internal state
  let MockConsoleTransport: jest.Mock;
  let MockDailyRotateFile: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear calls on all mocks
    // Need to reset the singleton instance cache
    // This is tricky because the Singleton is a class, but getLogger is a function.
    // The easiest way for testing is to clear the module cache for the logger
    // or expose a reset function in the logger's implementation.
    // For now, we rely on jest.clearAllMocks and checking instance creation.

    // Re-import to ensure a fresh singleton state if the module was loaded
    // This is problematic with Jest's module caching and Singleton.
    // A more robust way to test Singleton specifically is to expose a reset method
    // in the Singleton class (e.g., `LoggerManager.resetInstanceForTesting()`).
    // For this example, we'll assume the initial call will create it once per test file run,
    // and subsequent calls will return the same instance, allowing us to test `getInstance` effect.

    // When testing a true singleton, you'd usually create the instance once
    // at the start of all tests (e.g., in `beforeAll`) and then reuse it.
    // To test that it's *only* created once, you need a way to track internal state.

    // Let's assume getLogger() is called and initializes the singleton
    // for the first time in each relevant test.
  });

  it('should return the same logger instance (singleton pattern)', () => {
    // Directly access the internal LoggerManager to test getInstance
    const LoggerManagerModule = require('../src/utils/logger'); // Re-import to ensure fresh module state for this specific test
    const instance1 = LoggerManagerModule.getLogger();
    const instance2 = LoggerManagerModule.getLogger();

    expect(instance1).toBe(instance2); // Verify they are the same instance
    expect(createLogger).toHaveBeenCalledTimes(1); // Winston's createLogger should only be called once
  });

  it('should return the main logger when no context is provided to getLogger', () => {
    const logger = getLogger();
    // In our mock, logger is the main WinstonLogger mock instance
    expect(logger).toBeInstanceOf(Object); // It's our mock object
    expect((logger as any).info).toBeDefined(); // Ensure it has log methods
  });

  it('should return a child logger when context is provided to getLogger', () => {
    const logger = getLogger(); // Get the main logger instance first
    const childLogger = getLogger('TestContext');

    // Expect child to have been called on the main logger
    expect((logger as any).child).toHaveBeenCalledTimes(1);
    expect((logger as any).child).toHaveBeenCalledWith({ context: 'TestContext' });

    // Verify the returned child logger has the expected defaultMeta
    expect((childLogger as any).defaultMeta).toEqual({ context: 'TestContext' });
  });

  it('should log messages using the correct Winston level methods', () => {
    logger = getLogger();

    logger.info('Test info message', { test: 'info' });
    expect(logger.info).toHaveBeenCalledWith('Test info message', { test: 'info' });

    logger.error(new Error('Test error'), 'ErrorContext');
    expect(logger.error).toHaveBeenCalledWith(
      new Error('Test error'),
      expect.stringContaining('ErrorContext')
    );

    logger.debug('Debug details', { debugId: 123 });
    expect(logger.debug).toHaveBeenCalledWith('Debug details', { debugId: 123 });
  });
});
