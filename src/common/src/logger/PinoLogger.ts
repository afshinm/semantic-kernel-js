import pino from 'pino';
import { Logger } from './Logger';

/**
 * A logger implementation using the Pino logging library.
 */
export class PinoLogger implements Logger {
  private logger: pino.Logger;

  constructor(pinoInstance?: pino.Logger) {
    this.logger =
      pinoInstance ??
      pino({
        level: process?.env?.SK_LOG_LEVEL || 'info',
      });
  }

  info(message: string, context?: unknown): void {
    this.logger.info({ context }, message);
  }

  error(message: string, context?: unknown): void {
    this.logger.error({ context }, message);
  }

  warn(message: string, context?: unknown): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: unknown): void {
    this.logger.debug({ context }, message);
  }

  trace(message: string, context?: unknown): void {
    this.logger.trace({ context }, message);
  }

  fatal(message: string, context?: unknown): void {
    this.logger.fatal({ context }, message);
  }
}
