import { createLogger, format, transports, Logger as WinstonLogger, addColors } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file'; // Import the class directly
import  config  from '../config/config'; // Adjust the import path as necessary

interface LogMetadata {
  context?: string; // e.g., 'API', 'Database', 'AuthService'
  [key: string]: any; // Allows for any other key-value pairs
}

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
      // Filter out 'stack' from metadata if it's an error object
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
    new transports.DailyRotateFile({
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
    new transports.DailyRotateFile({
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

// --- Initialize Logger ---

const logger = createLogger({
  levels: customLevels.levels, // Apply custom levels
  // Default format for logs that don't pass through a specific transport format
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // Include stack trace for errors
    format.splat(), // For string interpolation
    format.json()
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
});

// Add colors to Winston for console output (optional but nice)
addColors(customLevels.colors);

// --- Best Practice: Module-Specific Logger ---
// While you can export the `logger` instance directly, it's often better
// to provide a factory function or a wrapper to create module-specific loggers.
// This allows for 'context' to be automatically added.

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
 * Factory function to create a logger instance with an optional default context.
 * This is a best practice for modular logging.
 * @param context The default context for this logger instance (e.g., 'AuthService', 'UserController').
 * @returns An initialized Winston logger instance.
 */
export function getLogger(context?: string): AppLogger {
  if (context) {
    // Return a child logger that adds the context to every log message
    // Winston's default metadata handling might require custom formatters to utilize 'context' directly.
    // For simplicity, we'll just return the main logger and encourage passing context as metadata.
    // However, if you want a true child logger with preset metadata, you can do:
    // return logger.child({ context }) as AppLogger;
  }
  return logger as AppLogger;
}