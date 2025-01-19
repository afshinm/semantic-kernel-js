import { AIServiceType } from '../services';
import { ChatClient } from './ChatClient';
import { ChatCompletion } from './ChatCompletion';
import { ChatMessage } from './ChatMessage';
import { ChatOptions } from './ChatOptions';

export class DelegateChatClient implements ChatClient {
  protected _innerClient: ChatClient;

  protected constructor(innerClient: ChatClient) {
    this._innerClient = innerClient;
  }

  get metadata() {
    return this._innerClient.metadata;
  }

  getService<T extends AIServiceType>(serviceType: T, serviceKey?: string): T | undefined {
    // If the key is non-null, we don't know what it means so pass through to the inner service.
    if (!serviceKey && serviceType instanceof this.constructor) {
      return this as unknown as T;
    }

    return this._innerClient.getService(serviceType, serviceKey);
  }

  complete(chatMessages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion> {
    return this._innerClient.complete(chatMessages, options);
  }
}
