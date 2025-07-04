import { ChatClient } from '.';
import { ChatMessage } from '../contents';
import { ChatOptions } from './ChatOptions';

/**
 * Provides an optional base class for an {@link ChatClient} that passes through calls to another instance.
 */
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

  override getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    return this._innerClient.getResponse(chatMessages, options);
  }

  override getStreamingResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    return this._innerClient.getStreamingResponse(chatMessages, options);
  }
}
