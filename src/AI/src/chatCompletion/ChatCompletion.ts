import { AdditionalProperties } from '../AdditionalProperties';
import { UsageDetails } from '../UsageDetails';
import { ChatMessage } from '../contents';
import { ChatFinishReason } from './ChatFinishReason';

/**
 * Represents the result of a chat completion request.
 */
export class ChatCompletion {
  public choices: ChatMessage[] = [];

  constructor({ choices, message }: { choices?: ChatMessage[]; message?: ChatMessage }) {
    if (!choices && !message) {
      throw new Error('Either choices or message must be provided.');
    }

    if (choices) {
      this.choices = choices;
    } else if (message) {
      this.choices = [message];
    }
  }

  get message() {
    if (!this.choices || !this.choices.length) {
      throw new Error(`The ChatCompletion instance does not contain any ChatMessage choices.`);
    }

    return this.choices[0];
  }

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
