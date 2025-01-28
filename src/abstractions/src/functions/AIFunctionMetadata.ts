import { AdditionalProperties } from '../AdditionalProperties';
import { AIFunctionParameterMetadata } from './AIFunctionParameterMetadata';
import { AIFunctionReturnParameterMetadata } from './AIFunctionReturnParameterMetadata';

export class AIFunctionMetadata<PARAMETERS = AIFunctionParameterMetadata> {
  public name: string = '';
  public description?: string;
  public parameters?: PARAMETERS;
  public returnParameter?: AIFunctionReturnParameterMetadata;
  public additionalProperties?: AdditionalProperties;
}
