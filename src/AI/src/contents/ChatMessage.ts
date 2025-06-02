import { AdditionalProperties } from '../AdditionalProperties';
import { ChatRole } from '../chatCompletion';
import { AIContent } from './AIContent';
import { concatText } from './AIContentHelper';
import { TextContent } from './TextContent';

export class ChatMessage {
  public contents: AIContent[] = [];
  public authorName?: string;
  public role: ChatRole;
  public rawRepresentation: unknown;
  public additionalProperties?: AdditionalProperties;

  constructor({ role, content, contents }: { role: ChatRole; content?: string | null; contents?: AIContent[] }) {
    if (content) {
      this.contents = [new TextContent(content)];
    }
    if (contents) {
      this.contents = contents;
    }
    this.role = role;
  }

  get text(): string {
    return concatText(this.contents);
  }

  static create(chatMessages: string | ChatMessage[]): ChatMessage[] {
    if (typeof chatMessages === 'string') {
      return [new ChatMessage({ role: 'user', content: chatMessages })];
    }

    return chatMessages;
  }

  toString(): string {
    return this.text;
  }
}
