import { Logger } from './Logger';
import { PinoLogger } from './PinoLogger';

/**
 * A factory class for creating and managing logger instances.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LoggerFactory {
  private static _logger: Logger | undefined = undefined;

  /**
   * Gets a singleton logger instance. If no logger has been set, it creates and returns a new PinoLogger instance.
   * @returns A singleton logger instance. If no logger has been set, it creates and returns a new PinoLogger instance.
   */
  static getLogger(): Logger {
    if (!this._logger) {
      this._logger = new PinoLogger();
    }
    return this._logger;
  }

  /**
   * Sets the logger instance to be used by the LoggerFactory.
   * @param logger The logger instance to set.
   */
  static setLogger(logger: Logger) {
    this._logger = logger;
  }
}
