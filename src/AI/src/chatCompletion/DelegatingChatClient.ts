import { ChatClient } from '.';
import { ChatMessage } from '../contents';
import { ChatOptions } from './ChatOptions';
import { ChatResponse } from './ChatResponse';
import { ChatResponseUpdate } from './ChatResponseUpdate';

export class DelegatingChatClient extends ChatClient {
  protected _innerClient: ChatClient;

  protected constructor(innerClient: ChatClient) {
    super();
    this._innerClient = innerClient;
  }

  get metadata() {
    return this._innerClient.metadata;
  }

  getService<T>(serviceType: T, serviceKey?: string): object | undefined {
    // If the key is non-null, we don't know what it means so pass through to the inner service.
    if (!serviceKey && serviceType === DelegatingChatClient) {
      return this;
    }

    return this._innerClient.getService(serviceType, serviceKey);
  }

  override complete(chatMessages: string | ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    return this._innerClient.complete(chatMessages, options);
  }

  override completeStreaming(
    chatMessages: string | ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatResponseUpdate> {
    return this._innerClient.completeStreaming(chatMessages, options);
  }
}
