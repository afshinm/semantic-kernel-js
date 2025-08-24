import { DefaultJsonSchema, FromSchema, JsonSchema } from '@semantic-kernel/ai';
import { Kernel } from '../Kernel';
import { FunctionResult } from './FunctionResult';
import { KernelArguments } from './KernelArguments';
import { KernelFunction } from './KernelFunction';

export interface KernelFunctionInvocationContext<
  ReturnType = unknown,
  Schema extends JsonSchema = typeof DefaultJsonSchema,
  Args = FromSchema<Schema>,
> {
  function: KernelFunction<ReturnType, Schema, Args>;
  arguments: KernelArguments<Schema, Args>;
  result: FunctionResult<ReturnType, Schema, Args>;
  isStreaming: boolean;
  kernel: Kernel;
}
