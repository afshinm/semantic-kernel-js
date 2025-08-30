import { type DefaultJsonSchema, type FromSchema, type JsonSchema } from '@semantic-kernel/ai';
import { type Kernel } from '../../Kernel';
import { type FunctionResult, type KernelArguments, type KernelFunction } from '../../functions';

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
