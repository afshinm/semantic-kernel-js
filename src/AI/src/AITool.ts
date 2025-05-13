import { AdditionalProperties } from './AdditionalProperties';

export class AITool {
  protected constructor() {}

  public name: string = '';
  public description: string = '';
  public additionalProperties: AdditionalProperties = new AdditionalProperties();
}
