import { AdditionalProperties } from '../AdditionalProperties';
import { AIContent } from '../contents/AIContent';
import { TextContent } from '../contents/TextContent';
import { ChatRole } from './ChatRole';

export class ChatMessage {
  private _contents?: AIContent[];
  private _authorName?: string;
  public role: ChatRole;
  public rawRepresentation: unknown;
  public additionalProperties?: AdditionalProperties;

  constructor({ role, content, contents }: { role: ChatRole; content?: string; contents?: AIContent[] }) {
    if (content) {
      this._contents = [new TextContent(content)];
    }
    if (contents) {
      this._contents = contents;
    }
    this.role = role;
  }

  get authorName() {
    return this._authorName;
  }

  set authorName(value: string | undefined) {
    this._authorName = value;
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

  get contents(): AIContent[] {
    return this._contents ?? [];
  }

  set contents(value: AIContent[]) {
    this._contents = value;
  }
}
