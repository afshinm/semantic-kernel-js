import { AdditionalProperties } from '../AdditionalProperties';
import { AIContent, TextContent } from '../contents';
import { ChatFinishReason } from './ChatFinishReason';
import { ChatRole } from './ChatRole';

/**
 * Represents a single streaming response chunk from a ChatClient.
 */
export class StreamingChatCompletionUpdate {
  /**
   * The completion update content items.
   */
  private _contents?: AIContent[];

  /**
   * The name of the author of the update.
   */
  private _authorName?: string;

  /**
   * Gets the name of the author of the completion update.
   */
  get authorName() {
    return this._authorName;
  }

  /**
   * Sets the name of the author of the completion update.
   */
  set authorName(value: string | undefined) {
    this._authorName = value;
  }

  /**
   * Gets or sets the role of the author of the completion update.
   */
  role?: ChatRole;

  get text() {
    return this.contents.find((content) => content instanceof TextContent)?.text;
  }

  set text(value: string | undefined) {
    if (!value) return;

    const textContent = this.contents.find((content) => content instanceof TextContent);
    if (textContent) {
      textContent.text = value;
    } else {
      this.contents.push(new TextContent(value));
    }
  }

  /**
   * Gets the chat completion update content items.
   */
  get contents() {
    return (this._contents ??= []);
  }

  /**
   * Sets the chat completion update content items.
   */
  set contents(value: AIContent[]) {
    this._contents = value;
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
    return this.contents.join('');
  }
}
