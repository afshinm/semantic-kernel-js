import { ChatMessage } from '../contents';
import { ChatClientBuilder } from './ChatClientBuilder';
import { ChatClientMetadata } from './ChatClientMetadata';
import { ChatOptions } from './ChatOptions';
import { ChatResponse } from './ChatResponse';
import { ChatResponseUpdate } from './ChatResponseUpdate';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor = abstract new (...args: any[]) => any;

/**
 * Abstract class representing a chat client that can interact with a chat service.
 */
export abstract class ChatClient {
  /**
   * Get a response from the chat client based on the provided chat messages.
   * @param chatMessages - A string or an array of ChatMessage objects representing the conversation history.
   * @param options - Optional parameters to customize the chat response, such as temperature, max tokens, etc.
   */
  abstract getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Get a streaming response from the chat client based on the provided chat messages.
   * @param chatMessages - A string or an array of ChatMessage objects representing the conversation history.
   * @param options - Optional parameters to customize the chat response, such as temperature, max tokens, etc.
   */
  abstract getStreamingResponse(
    chatMessages: string | ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatResponseUpdate>;

  abstract get metadata(): ChatClientMetadata;

  /**
   * Asks the chat client to provide a service of a specific type.
   * @param serviceType - The type of service to retrieve, which is typically a class or interface.
   * @param serviceKey - An optional key to identify a specific service instance.
   *
   * TODO: Fix this to return the correct type instead of object.
   */
  abstract getService<T extends Constructor>(serviceType: T, serviceKey?: string): InstanceType<T> | undefined;

  asBuilder(): ChatClientBuilder {
    return new ChatClientBuilder({ innerClient: this });
  }
}
