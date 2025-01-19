import { AIServiceType } from '../services';
import { ChatCompletion } from './ChatCompletion';
import { ChatMessage } from './ChatMessage';
import { ChatOptions } from './ChatOptions';
import { ChatClientMetadata } from './ClientChatMetadata';

export interface ChatClient {
  complete(chatMessages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion>;

  /** 
     * TODO
    completeStreaming(
        chatMessages: ChatMessage[],
        options?: ChatOptions,
    ): AsyncGenerator<StreamingChatCompletionUpdate>;
    */

  get metadata(): ChatClientMetadata;
  getService<T extends AIServiceType>(serviceType: T, serviceKey?: string): T | undefined;
}
