import { AITool } from '../AITool';
import { FromSchema, JsonSchema } from '../jsonSchema';
import { AIFunctionArguments } from './AIFunctionArguments';

export abstract class AIFunction<
  ReturnType,
  Schema extends JsonSchema = false,
  Args = FromSchema<Schema>,
> extends AITool {
  public jsonSchema: Schema | undefined;

  invoke(args?: AIFunctionArguments<Schema, Args>): Promise<ReturnType> {
    return this.invokeCore(args);
  }

  protected abstract invokeCore(args?: AIFunctionArguments<Schema, Args>): Promise<ReturnType>;
}
