import { Logger, LoggerFactory } from '@semantic-kernel/common';
import { ChatMessage } from '../contents';
import { ChatOptions } from './ChatOptions';
import { DelegatingChatClient } from './DelegatingChatClient';

/**
 * A delegating chat client that logs chat operations to an {@link Logger} instance.
 */
export class LoggingChatClient extends DelegatingChatClient {
  private logger: Logger;

  public constructor(chatClient: DelegatingChatClient, logger?: Logger) {
    super(chatClient);
    this.logger = logger ?? LoggerFactory.getLogger();
  }

  override async getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    this.logger.debug(`${this.getResponse.name} invoked.`);
    this.logger.trace(`${this.getResponse.name} invoked.`, { chatMessages, options });

    try {
      const response = await super.getResponse(chatMessages, options);
      this.logger.debug(`${this.getResponse.name} completed.`);
      this.logger.trace(`${this.getResponse.name} completed.`, { response });

      return response;
    } catch (error) {
      this.logger.error(`${this.getResponse.name} failed.`, { error });
      throw error;
    }
  }

  override async *getStreamingResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    this.logger.debug(`${this.getStreamingResponse.name} invoked.`);
    this.logger.trace(`${this.getStreamingResponse.name} invoked.`, { chatMessages, options });

    try {
      const response = super.getStreamingResponse(chatMessages, options);
      this.logger.debug(`${this.getStreamingResponse.name} completed.`);

      for await (const update of response) {
        this.logger.trace(`${this.getStreamingResponse.name} update.`, { update });
        yield update;
      }
    } catch (error) {
      this.logger.error(`${this.getStreamingResponse.name} failed.`, { error });
      throw error;
    }
  }
}

export const logging = (chatClient: DelegatingChatClient) => {
  return new LoggingChatClient(chatClient);
};
