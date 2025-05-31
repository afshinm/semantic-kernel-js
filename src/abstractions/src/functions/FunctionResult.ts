import { type DefaultJsonSchema, type FromSchema, type JsonSchema } from '@semantic-kernel/ai';
import { type KernelFunction } from '.';

export type FunctionResult<
  ReturnType = unknown,
  Schema extends JsonSchema = typeof DefaultJsonSchema,
  Args = FromSchema<Schema>,
> = {
  function: KernelFunction<ReturnType, Schema, Args>;
  value?: ReturnType;
  renderedPrompt?: string;
};
