import { ChatMessage } from '../../contents/ChatMessage';
import { type AgentRunOptions } from './AgentRunOptions';
import { AgentRunResponse } from './AgentRunResponse';
import { AgentRunResponseUpdate } from './AgentRunResponseUpdate';
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
  ): Promise<AgentRunResponse> {
    return await this.runCore(this.getMessages(messages), thread, options);
  }

  async *runStreaming(
    messages: string | ChatMessage | ChatMessage[],
    thread?: AgentThread,
    options?: AgentRunOptions
  ): AsyncGenerator<AgentRunResponseUpdate> {
    yield* this.runStreamingCore(this.getMessages(messages), thread, options);
  }

  protected abstract runCore(
    messages: ChatMessage[],
    thread?: AgentThread,
    options?: AgentRunOptions
  ): Promise<AgentRunResponse>;

  protected abstract runStreamingCore(
    messages: ChatMessage[],
    thread?: AgentThread,
    options?: AgentRunOptions
  ): AsyncGenerator<AgentRunResponseUpdate>;

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

  /**
   * Notify the given thread of new messages.
   * @param thread Thread to notify.
   * @param messages New messages.
   */
  protected async notifyThreadOfNewMessages(thread: AgentThread, messages: ChatMessage[]) {
    if (messages.length) {
      await thread.onNewMessage(messages);
    }
  }
}
