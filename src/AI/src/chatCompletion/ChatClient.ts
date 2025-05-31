import { ChatMessage } from '../contents';
import { ChatClientBuilder } from './ChatClientBuilder';
import { ChatClientMetadata } from './ChatClientMetadata';
import { ChatOptions } from './ChatOptions';
import { ChatResponse } from './ChatResponse';
import { ChatResponseUpdate } from './ChatResponseUpdate';

export abstract class ChatClient {
  abstract complete(chatMessages: string | ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  abstract completeStreaming(
    chatMessages: string | ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatResponseUpdate>;

  abstract get metadata(): ChatClientMetadata;
  abstract getService<T>(serviceType: T, serviceKey?: string): object | undefined;

  asBuilder(): ChatClientBuilder {
    return new ChatClientBuilder({ innerClient: this });
  }
}
