import { type ChatMessage } from '../contents/ChatMessage';
import { ChatClient, type Constructor } from './ChatClient';
import { type ChatOptions } from './ChatOptions';

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

  getService<T extends Constructor>(serviceType: T, serviceKey?: string): InstanceType<T> | undefined {
    // If the key is non-null, we don't know what it means so pass through to the inner service.
    if (!serviceKey && this.constructor === serviceType) {
      return this as InstanceType<T>;
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
