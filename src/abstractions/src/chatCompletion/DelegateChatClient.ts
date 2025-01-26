import { ChatClient } from './ChatClient';
import { ChatCompletion } from './ChatCompletion';
import { ChatMessage } from './ChatMessage';
import { ChatOptions } from './ChatOptions';

export class DelegateChatClient extends ChatClient {
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
    if (!serviceKey && serviceType === DelegateChatClient) {
      return this;
    }

    return this._innerClient.getService(serviceType, serviceKey);
  }

  complete(chatMessages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion> {
    return this._innerClient.complete(chatMessages, options);
  }
}
