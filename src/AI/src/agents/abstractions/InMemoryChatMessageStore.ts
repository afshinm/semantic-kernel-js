import { type ChatMessage } from '../../contents/ChatMessage';
import { type ChatMessageStore } from './ChatMessageStore';

export class InMemoryChatMessageStore implements ChatMessageStore {
  private readonly _messages: ChatMessage[] = [];

  get count() {
    return this._messages.length;
  }

  async getMessages(): Promise<ChatMessage[]> {
    return this._messages;
  }

  async addMessages(messages: ChatMessage[]): Promise<void> {
    this._messages.push(...messages);
  }
}
