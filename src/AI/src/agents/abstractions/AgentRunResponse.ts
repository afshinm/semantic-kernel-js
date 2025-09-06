import { AdditionalProperties } from '../../AdditionalProperties';
import { ChatResponse } from '../../chatCompletion';
import { concatText } from '../../contents/AIContentHelper';
import { ChatMessage } from '../../contents/ChatMessage';
import { UsageDetails } from '../../UsageDetails';

export class AgentRunResponse {
  private _messages: ChatMessage[] = [];

  agentId?: string;
  responseId?: string;
  createdAt?: number;
  usage?: UsageDetails;
  rawRepresentation?: unknown;
  additionalProperties?: AdditionalProperties;

  constructor(message?: ChatResponse | ChatMessage | ChatMessage[]) {
    if (message instanceof ChatResponse) {
      this.additionalProperties = message.additionalProperties;
      this.createdAt = message.createdAt;
      this._messages = message.messages;
      this.rawRepresentation = message.rawRepresentation;
      this.responseId = message.responseId;
      this.usage = message.usage;
    } else if (message instanceof ChatMessage) {
      this._messages = [message];
    } else {
      this._messages = message ?? [];
    }
  }

  get messages(): ChatMessage[] {
    return this._messages;
  }

  get text(): string {
    return concatText(this._messages);
  }

  toString() {
    return this.text;
  }
}
