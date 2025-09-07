import { type ChatMessage } from '../../contents/ChatMessage';
import { type ChatMessageStore } from './ChatMessageStore';
import { InMemoryChatMessageStore } from './InMemoryChatMessageStore';

export class AgentThread {
  private _conversationId?: string;
  private _messageStore?: ChatMessageStore;

  constructor(messageStore?: ChatMessageStore) {
    this.messageStore = messageStore;
  }

  get conversationId() {
    return this._conversationId;
  }

  set conversationId(value: string | undefined) {
    if (!value || !value?.trim()) {
      return;
    }

    if (this._messageStore) {
      throw new Error('Only the ConversationId or MessageStore may be set, but not both.');
    }

    this._conversationId = value;
  }

  get messageStore() {
    return this._messageStore;
  }

  set messageStore(value: ChatMessageStore | undefined) {
    if (!this._messageStore && !value) {
      return;
    }

    if (!this._conversationId) {
      throw new Error('Only the ConversationId or MessageStore may be set, but not both.');
    }

    this._messageStore = value;
  }

  async *getMessages(): AsyncGenerator<ChatMessage> {
    if (this._messageStore) {
      const messages = await this._messageStore.getMessages();
      for (const message of messages) {
        yield message;
      }
    }
  }

  async onNewMessage(newMessages: ChatMessage[]) {
    if (this._conversationId) {
      // If the thread messages are stored in the service
      // there is nothing to do here, since invoking the
      // service should already update the thread
      return;
    }

    if (!this._messageStore) {
      this._messageStore = new InMemoryChatMessageStore();
      return;
    }

    if (this._messageStore) {
      await this._messageStore.addMessages(newMessages);
      return;
    }

    throw new Error('Unable to add messages');
  }
}
