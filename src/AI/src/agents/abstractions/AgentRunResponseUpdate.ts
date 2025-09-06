import { AdditionalProperties } from '../../AdditionalProperties';
import { ChatResponseUpdate, ChatRole } from '../../chatCompletion';
import { AIContent } from '../../contents';
import { concatText } from '../../contents/AIContentHelper';

export class AgentRunResponseUpdate {
  private _contents: AIContent[] = [];

  authorName?: string;
  createdAt?: number;
  additionalProperties?: AdditionalProperties;
  role?: ChatRole;
  messageId?: string;
  responseId?: string;
  rawRepresentation?: unknown;

  constructor({
    role,
    content,
    contents,
    chatResponseUpdate,
  }: {
    role?: ChatRole;
    content?: AIContent;
    contents?: AIContent[];
    chatResponseUpdate?: ChatResponseUpdate;
  }) {
    if (content) {
      this._contents = [content];
      this.role = role;
    } else if (contents?.length) {
      this._contents = contents;
      this.role = role;
    } else if (chatResponseUpdate) {
      this.additionalProperties = chatResponseUpdate.additionalProperties;
      this.authorName = chatResponseUpdate.authorName;
      this._contents = chatResponseUpdate.contents;
      this.createdAt = chatResponseUpdate.createdAt;
      this.messageId = chatResponseUpdate.messageId;
      this.rawRepresentation = chatResponseUpdate.rawRepresentation;
      this.responseId = chatResponseUpdate.responseId;
      this.role = chatResponseUpdate.role;
    }
  }

  get contents() {
    return this._contents;
  }

  get text() {
    return concatText(this._contents);
  }
}
