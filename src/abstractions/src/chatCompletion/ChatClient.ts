import { ChatClientBuilder } from './ChatClientBuilder';
import { ChatClientMetadata } from './ChatClientMetadata';
import { ChatCompletion } from './ChatCompletion';
import { ChatMessage } from './ChatMessage';
import { ChatOptions } from './ChatOptions';

export abstract class ChatClient {
  abstract complete(chatMessages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion>;

  /** 
     * TODO
    completeStreaming(
        chatMessages: ChatMessage[],
        options?: ChatOptions,
    ): AsyncGenerator<StreamingChatCompletionUpdate>;
    */

  abstract get metadata(): ChatClientMetadata;
  abstract getService<T>(serviceType: T, serviceKey?: string): object | undefined;

  asBuilder(): ChatClientBuilder {
    return new ChatClientBuilder({ innerClient: this });
  }
}
