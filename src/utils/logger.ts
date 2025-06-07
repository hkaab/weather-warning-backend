import { createLogger, format, transports, Logger as WinstonLogger, addColors } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file'; // Import the class directly
import config from '../config/config'; // Adjust the import path as necessary

/**
 * Interface for log metadata, allowing context and other key-value pairs.
 */
interface LogMetadata {
  context?: string; // e.g., 'API', 'Database', 'AuthService'
  [key: string]: any; // Allows for any other key-value pairs
}

/**
 * Extends WinstonLogger to include common log methods with optional metadata/context.
 * This provides better type inference for how we intend to use our logger.
 */
export type AppLogger = WinstonLogger & {
  error(message: string | Error, metadata?: LogMetadata | string): WinstonLogger;
  warn(message: string, metadata?: LogMetadata | string): WinstonLogger;
  info(message: string, metadata?: LogMetadata | string): WinstonLogger;
  http(message: string, metadata?: LogMetadata | string): WinstonLogger;
  verbose(message: string, metadata?: LogMetadata | string): WinstonLogger;
  debug(message: string, metadata?: LogMetadata | string): WinstonLogger;
  silly(message: string, metadata?: LogMetadata | string): WinstonLogger;
};

/**
 * LoggerManager class implements the Singleton pattern for our Winston logger.
 * It ensures that only one instance of the Winston logger is created and
 * provides a global point of access to it.
 */
class LoggerManager {
  // The single instance of the LoggerManager class.
  private static instance: LoggerManager;
  // The actual Winston logger instance.
  private _logger: AppLogger;

  /**
   * Private constructor to prevent direct instantiation.
   * Initializes the Winston logger with its transports and formats.
   */
  private constructor() {
    console.log('LoggerManager: Initializing Winston logger (This should happen only once).');

    // Map custom levels to Winston's standard levels (optional, but good for consistency)
    const customLevels = {
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3, // For HTTP request logging
        verbose: 4,
        debug: 5,
        silly: 6,
      },
      colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        verbose: 'cyan',
        debug: 'blue',
        silly: 'white',
      },
    };

    // --- Formats ---

    // Combine format for console logs
    const consoleFormat = format.combine(
      format.colorize({ all: true }), // Apply colors for console output
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ level, message, timestamp, context, ...metadata }) => {
        let logMessage = `${timestamp} [${level}]`;
        if (context) {
          logMessage += ` [${context}]`;
        }
        logMessage += ` ${message}`;

        // Append metadata if present
        if (Object.keys(metadata).length > 0) {
          // Filter out 'stack' from metadata if it's an error object (Winston adds it by default)
          const filteredMetadata = { ...metadata };
          if (filteredMetadata.stack) {
            delete filteredMetadata.stack;
          }
          logMessage += ` ${JSON.stringify(filteredMetadata)}`;
        }
        return logMessage;
      })
    );

    // JSON format for file logs (better for machine parsing)
    const fileFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.json() // Logs will be in JSON format
    );

    // --- Transports ---

    const consoleTransport = new transports.Console({
      level: config.log.level, // Use config level
      format: consoleFormat,
      handleExceptions: true, // Crucial for catching uncaught exceptions
    });

    const fileTransports: DailyRotateFile[] = [];
    if (config.log.file.enabled) {
      fileTransports.push(
        new DailyRotateFile({ // Use DailyRotateFile directly, not transports.DailyRotateFile
          level: config.log.level, // Use config level
          filename: config.log.file.fileName,
          dirname: config.log.file.directory,
          datePattern: 'YYYY-MM-DD', // Rotates daily
          zippedArchive: true, // Compresses old log files
          maxSize: config.log.file.maxSize,
          maxFiles: config.log.file.maxFiles,
          format: fileFormat, // Use JSON format for files
          handleExceptions: true, // Crucial for catching uncaught exceptions
        })
      );
      // Optional: A separate transport for error logs only
      fileTransports.push(
        new DailyRotateFile({ // Use DailyRotateFile directly
          level: 'error', // Only log errors to this file
          filename: 'error-%DATE%.log',
          dirname: config.log.file.directory,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: config.log.file.maxSize,
          maxFiles: config.log.file.maxFiles,
          format: fileFormat,
        })
      );
    }

    // Initialize the Winston logger
    this._logger = createLogger({
      levels: customLevels.levels, // Apply custom levels
      // Default format for logs that don't pass through a specific transport format
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }), // Include stack trace for errors
        format.splat(), // For string interpolation (needed for printf format)
        format.json() // Default to JSON for any logs not caught by other formats
      ),
      transports: [
        consoleTransport,
        ...fileTransports,
        // Add other transports here (e.g., new transports.Http(...) for remote logging)
      ],
      exceptionHandlers: [
        // These will catch uncaught exceptions and log them
        consoleTransport, // Log to console
        ...fileTransports, // Log to file(s)
      ],
      rejectionHandlers: [
        // These will catch unhandled promise rejections and log them
        consoleTransport, // Log to console
        ...fileTransports, // Log to file(s)
      ],
      exitOnError: false, // Do not exit on handled exceptions
    }) as AppLogger; // Cast to AppLogger type

    // Add colors to Winston for console output (optional but nice)
    addColors(customLevels.colors);

    // Register process handlers for graceful shutdown *once* with the singleton
  }

  /**
   * Public static method to get the single instance of the LoggerManager.
   * If the instance doesn't exist, it creates it; otherwise, it returns the existing one.
   * @returns The single instance of LoggerManager.
   */
  public static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager();
    }
    return LoggerManager.instance;
  }

  /**
   * Returns the initialized Winston logger instance.
   * This is the method callers will use to get the actual logger.
   * @param context An optional default context for this specific logger instance.
   * @returns The Winston logger instance.
   */
  public getLogger(context?: string): AppLogger {
    if (context) {
      // Create a child logger with default metadata for context
      return this._logger.child({ context }) as AppLogger;
    }
    return this._logger;
  }
}

// Global function to get the logger, ensuring it's always the singleton instance.
/**
 * Factory function to retrieve the singleton Winston logger instance.
 * @param context An optional default context to apply to this logger instance.
 * @returns The Winston logger.
 */
export function getLogger(context?: string): AppLogger {
  return LoggerManager.getInstance().getLogger(context);
}
