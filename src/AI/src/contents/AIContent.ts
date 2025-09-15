import { AdditionalProperties } from '../AdditionalProperties';
import { AIAnnotation } from './AIAnnotation';

export abstract class AIContent {
  public rawRepresentation?: unknown;
  public additionalProperties?: AdditionalProperties;
  public annotations?: AIAnnotation[];

  /**
   * The type of the AI content, which is used to identify the specific subclass in JSON serialization.
   * This property is automatically set to the name of the class when the object is created.
   */
  public type?: string;

  toJSON(): object {
    return Object.assign(
      {
        type: this.constructor.name,
      },
      this
    );
  }
}
