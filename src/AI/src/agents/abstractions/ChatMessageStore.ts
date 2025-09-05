import { type ChatMessage } from '../../contents';

export interface ChatMessageStore {
  getMessages(): Promise<ChatMessage[]>;
  addMessages(messages: ChatMessage[]): Promise<void>;
}
