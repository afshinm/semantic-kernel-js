import { AITool } from '../AITool';
import { AIFunctionMetadata } from './AIFunctionMetadata';
import { AIFunctionParameterMetadata } from './AIFunctionParameterMetadata';
import { FromSchema } from 'json-schema-to-ts';

export abstract class AIFunction<
  PARAMETERS extends AIFunctionParameterMetadata = AIFunctionParameterMetadata,
  SCHEMA = FromSchema<PARAMETERS>,
> extends AITool {
  abstract get metadata(): AIFunctionMetadata<PARAMETERS>;

  invoke(args?: SCHEMA) {
    return this.invokeCore(args);
  }

  protected abstract invokeCore(args?: SCHEMA): Promise<unknown>;
}
