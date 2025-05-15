import { DefaultJsonSchema, FromSchema, JsonSchema } from '@semantic-kernel/ai';
import { KernelFunction } from './KernelFunction';

export type FunctionResult<
  ReturnType = unknown,
  Schema extends JsonSchema = typeof DefaultJsonSchema,
  Args = FromSchema<Schema>,
> = {
  function?: KernelFunction<ReturnType, Schema, Args>;
  value?: ReturnType;
  renderedPrompt?: string;
};
