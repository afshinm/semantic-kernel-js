import { AdditionalProperties } from '../AdditionalProperties';
import { AIContent } from '../contents/AIContent';
import { concatText } from '../contents/AIContentHelper';
import { ChatFinishReason } from './ChatFinishReason';
import { ChatRole } from './ChatRole';

/**
 * Represents a single streaming response chunk from a ChatClient.
 */
export class ChatResponseUpdate {
  /**
   * The completion update content items.
   */
  public contents: AIContent[] = [];

  /**
   * The name of the author of the update.
   */
  public authorName?: string;

  /**
   * Gets or sets the role of the author of the completion update.
   */
  role?: ChatRole;

  get text(): string {
    return concatText(this.contents);
  }

  rawRepresentation: unknown;

  additionalProperties?: AdditionalProperties;

  /**
   * Gets or sets the ID of the completion of which this update is a part.
   */
  completionId?: string;

  /**
   * Gets or sets a timestamp for the completion update.
   */
  createdAt?: number;

  /**
   * Gets or sets the zero-based index of the choice with which this update is associated in the streaming sequence.
   */
  choiceIndex: number = 0;

  /**
   * Gets or sets the finish reason for the operation.
   */
  finishReason?: ChatFinishReason;

  /**
   * Gets or sets the model ID using in the creation of the chat completion of which this update is a part.
   */
  modelId?: string;

  toString(): string {
    return this.text;
  }

  /**
   * Creates a new instance of ChatResponseUpdate from a JSON string.
   * @param data The JSON string representing the ChatResponseUpdate.
   * @returns A new instance of ChatResponseUpdate populated with the data from the JSON string.
   */
  static fromJSON(data: string): ChatResponseUpdate {
    const parsedData = JSON.parse(data) as Partial<ChatResponseUpdate>;
    const newObj = Object.assign(new ChatResponseUpdate(), parsedData);
    newObj.contents = (parsedData.contents ?? []).map(AIContent.fromJSON);
    return newObj;
  }
}
