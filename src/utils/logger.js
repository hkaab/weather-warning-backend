"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = getLogger;
var winston_1 = require("winston");
var winston_daily_rotate_file_1 = require("winston-daily-rotate-file"); // Import the class directly
var config_1 = require("../config/config"); // Adjust the import path as necessary
/**
 * LoggerManager class implements the Singleton pattern for our Winston logger.
 * It ensures that only one instance of the Winston logger is created and
 * provides a global point of access to it.
 */
var LoggerManager = /** @class */ (function () {
    /**
     * Private constructor to prevent direct instantiation.
     * Initializes the Winston logger with its transports and formats.
     */
    function LoggerManager() {
        console.log('LoggerManager: Initializing Winston logger (This should happen only once).');
        // Map custom levels to Winston's standard levels (optional, but good for consistency)
        var customLevels = {
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
        var consoleFormat = winston_1.format.combine(winston_1.format.colorize({ all: true }), // Apply colors for console output
        winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.printf(function (_a) {
            var level = _a.level, message = _a.message, timestamp = _a.timestamp, context = _a.context, metadata = __rest(_a, ["level", "message", "timestamp", "context"]);
            var logMessage = "".concat(timestamp, " [").concat(level, "]");
            if (context) {
                logMessage += " [".concat(context, "]");
            }
            logMessage += " ".concat(message);
            // Append metadata if present
            if (Object.keys(metadata).length > 0) {
                // Filter out 'stack' from metadata if it's an error object (Winston adds it by default)
                var filteredMetadata = __assign({}, metadata);
                if (filteredMetadata.stack) {
                    delete filteredMetadata.stack;
                }
                logMessage += " ".concat(JSON.stringify(filteredMetadata));
            }
            return logMessage;
        }));
        // JSON format for file logs (better for machine parsing)
        var fileFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.json() // Logs will be in JSON format
        );
        // --- Transports ---
        var consoleTransport = new winston_1.transports.Console({
            level: config_1.default.log.level, // Use config level
            format: consoleFormat,
            handleExceptions: true, // Crucial for catching uncaught exceptions
        });
        var fileTransports = [];
        if (config_1.default.log.file.enabled) {
            fileTransports.push(new winston_daily_rotate_file_1.default({
                level: config_1.default.log.level, // Use config level
                filename: config_1.default.log.file.fileName,
                dirname: config_1.default.log.file.directory,
                datePattern: 'YYYY-MM-DD', // Rotates daily
                zippedArchive: true, // Compresses old log files
                maxSize: config_1.default.log.file.maxSize,
                maxFiles: config_1.default.log.file.maxFiles,
                format: fileFormat, // Use JSON format for files
                handleExceptions: true, // Crucial for catching uncaught exceptions
            }));
            // Optional: A separate transport for error logs only
            fileTransports.push(new winston_daily_rotate_file_1.default({
                level: 'error', // Only log errors to this file
                filename: 'error-%DATE%.log',
                dirname: config_1.default.log.file.directory,
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: config_1.default.log.file.maxSize,
                maxFiles: config_1.default.log.file.maxFiles,
                format: fileFormat,
            }));
        }
        // Initialize the Winston logger
        this._logger = (0, winston_1.createLogger)({
            levels: customLevels.levels, // Apply custom levels
            // Default format for logs that don't pass through a specific transport format
            format: winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), // Include stack trace for errors
            winston_1.format.splat(), // For string interpolation (needed for printf format)
            winston_1.format.json() // Default to JSON for any logs not caught by other formats
            ),
            transports: __spreadArray([
                consoleTransport
            ], fileTransports, true),
            exceptionHandlers: __spreadArray([
                // These will catch uncaught exceptions and log them
                consoleTransport
            ], fileTransports, true),
            rejectionHandlers: __spreadArray([
                // These will catch unhandled promise rejections and log them
                consoleTransport
            ], fileTransports, true),
            exitOnError: false, // Do not exit on handled exceptions
        }); // Cast to AppLogger type
        // Add colors to Winston for console output (optional but nice)
        (0, winston_1.addColors)(customLevels.colors);
        // Register process handlers for graceful shutdown *once* with the singleton
    }
    /**
     * Public static method to get the single instance of the LoggerManager.
     * If the instance doesn't exist, it creates it; otherwise, it returns the existing one.
     * @returns The single instance of LoggerManager.
     */
    LoggerManager.getInstance = function () {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    };
    /**
     * Returns the initialized Winston logger instance.
     * This is the method callers will use to get the actual logger.
     * @param context An optional default context for this specific logger instance.
     * @returns The Winston logger instance.
     */
    LoggerManager.prototype.getLogger = function (context) {
        if (context) {
            // Create a child logger with default metadata for context
            return this._logger.child({ context: context });
        }
        return this._logger;
    };
    return LoggerManager;
}());
// Global function to get the logger, ensuring it's always the singleton instance.
/**
 * Factory function to retrieve the singleton Winston logger instance.
 * @param context An optional default context to apply to this logger instance.
 * @returns The Winston logger.
 */
function getLogger(context) {
    return LoggerManager.getInstance().getLogger(context);
}
