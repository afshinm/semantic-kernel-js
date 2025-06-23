import { AdditionalProperties } from '../AdditionalProperties';
import { createAIContentFromJSON } from './AIContentHelper';

export class AIContent {
  public rawRepresentation?: unknown;
  public additionalProperties?: AdditionalProperties;
  /**
   * The type of the AI content, which is used to identify the specific subclass in JSON serialization.
   * This property is automatically set to the name of the class when the object is created.
   */
  public type?: string;

  static fromJSON(data: AIContent) {
    return createAIContentFromJSON(data);
  }

  toJSON(): object {
    return Object.assign(
      {
        type: this.constructor.name,
      },
      this
    );
  }
}
