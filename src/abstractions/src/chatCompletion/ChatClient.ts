import { ChatMessage } from './ChatMessage';
import { ChatOptions } from './ChatOptions';

export interface ChatClient {
  complete(chatMessages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion>;

  /** 
     * TODO
    completeStreaming(
        chatMessages: ChatMessage[],
        options?: ChatOptions,
    ): AsyncGenerator<StreamingChatCompletionUpdate>;
    */
}
