import { AdditionalProperties } from '../AdditionalProperties';
import { ChatRole } from '../chatCompletion';
import { AIContent } from './AIContent';
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

  get text(): string | undefined {
    if (this.contents.length && this.contents[0] instanceof TextContent) {
      return this.contents[0].text;
    }
  }

  set text(value: string | undefined) {
    if (!value) return;

    if (this.contents.length && this.contents[0] instanceof TextContent) {
      this.contents[0].text = value;
    } else {
      this.contents.push(new TextContent(value));
    }
  }

  static create(chatMessages: string | ChatMessage[]): ChatMessage[] {
    if (typeof chatMessages === 'string') {
      return [new ChatMessage({ role: 'user', content: chatMessages })];
    }

    return chatMessages;
  }
}
