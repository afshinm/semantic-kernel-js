import { ChatMessage } from '../../contents/ChatMessage';
import { type AgentRunOptions } from './AgentRunOptions';
import { AgentThread } from './AgentThread';

export abstract class AIAgent {
  id: string = Math.random().toString(36).substring(7);
  name?: string;
  description?: string;

  get displayName(): string {
    return this.name ?? this.id;
  }

  getService<T>(serviceType: T, serviceKey?: string) {
    if (!serviceKey && serviceType == AIAgent) {
      return this;
    }
  }

  getNewThread(): AgentThread {
    return new AgentThread();
  }

  async run(
    messages: string | ChatMessage | ChatMessage[],
    thread?: AgentThread,
    options?: AgentRunOptions
  ): Promise<void> {
    await this.runCore(this.getMessages(messages), thread, options);
  }

  async *runStreaming(
    messages: string | ChatMessage | ChatMessage[],
    thread?: AgentThread,
    options?: AgentRunOptions
  ): AsyncGenerator<ChatMessage> {
    yield* this.runStreamingCore(this.getMessages(messages), thread, options);
  }

  protected abstract runCore(messages: ChatMessage[], thread?: AgentThread, options?: AgentRunOptions): Promise<void>;
  protected abstract runStreamingCore(
    messages: ChatMessage[],
    thread?: AgentThread,
    options?: AgentRunOptions
  ): AsyncGenerator<ChatMessage>;

  private getMessages(messages: string | ChatMessage | ChatMessage[]): ChatMessage[] {
    let userMessages: ChatMessage[] = [];

    if (typeof messages === 'string') {
      userMessages = [
        new ChatMessage({
          role: 'user',
          content: messages,
        }),
      ];
    } else if (messages instanceof ChatMessage) {
      userMessages = [messages];
    } else if (Array.isArray(messages)) {
      userMessages = messages;
    }

    return userMessages;
  }
}
