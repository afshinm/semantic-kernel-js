import { AdditionalProperties } from '../AdditionalProperties';
import { UsageDetails } from '../UsageDetails';
import { ChatMessage } from '../contents';
import { concatText } from '../contents/AIContentHelper';
import { ChatFinishReason } from './ChatFinishReason';

/**
 * Represents the result of a chat completion request.
 */
export class ChatResponse {
  private _messages: ChatMessage[] = [];

  constructor({ choices, message }: { choices?: ChatMessage[]; message?: ChatMessage }) {
    if (!choices && !message) {
      throw new Error('Either choices or message must be provided.');
    }

    if (choices) {
      this._messages = choices;
    } else if (message) {
      this._messages = [message];
    }
  }

  get message() {
    if (!this._messages || !this._messages.length) {
      throw new Error(`The ChatResponse instance does not contain any ChatMessage choices.`);
    }

    return this._messages[0];
  }

  get messages() {
    return this._messages;
  }

  get text() {
    return concatText(this._messages);
  }

  toString(): string {
    return this.text;
  }

  /**
   * Response id of the chat response.
   */
  responseId?: string;

  /**
   * Gets or sets the ID of the chat completion.
   */
  completionId?: string;

  /**
   * Gets or sets the model ID used in the creation of the chat completion.
   */
  modelId?: string;

  /**
   * Gets or sets a timestamp for the chat completion.
   */
  createdAt?: number;

  /**
   * Gets or sets the reason for the chat completion.
   */
  finishReason?: ChatFinishReason;

  /**
   * Gets or sets usage details for the chat completion.
   */
  usage?: UsageDetails;

  /**
   * Gets or sets the raw representation of the chat completion from an underlying implementation.
   */
  rawRepresentation?: unknown;

  /**
   * Gets or sets any additional properties associated with the chat completion.
   */
  additionalProperties?: AdditionalProperties;
}
