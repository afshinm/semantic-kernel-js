/**
 * A simple logger interface for logging messages, errors, and warnings.
 */
export interface Logger {
  /**
   * Logs an informational message with an optional context.
   * @param message The message to log.
   * @param context Optional context to include with the log message.
   */
  info(message: string, context?: unknown): void;

  /**
   * Logs an error message with an optional context.
   * @param message The error message to log.
   * @param context Optional context to include with the log message.
   */
  error(message: string, context?: unknown): void;

  /**
   * Logs a warning message with an optional context.
   * @param message The warning message to log.
   * @param context Optional context to include with the log message.
   */
  warn(message: string, context?: unknown): void;

  /**
   * Logs a debug message with an optional context.
   * @param message The debug message to log.
   * @param context Optional context to include with the log message.
   */
  debug(message: string, context?: unknown): void;

  /**
   * Logs a trace message with an optional context.
   * @param message The trace message to log.
   * @param context Optional context to include with the log message.
   */
  trace(message: string, context?: unknown): void;

  /**
   * Logs a fatal error message with an optional context.
   * @param message The fatal error message to log.
   * @param context Optional context to include with the log message.
   */
  fatal(message: string, context?: unknown): void;
}
