import { AdditionalProperties } from '../dist';

export class AITool {
  protected constructor() {}

  public name: string = '';
  public description: string = '';
  public additionalProperties: AdditionalProperties = new AdditionalProperties();
}
