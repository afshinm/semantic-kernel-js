import { DefaultJsonSchema, FromSchema, JsonSchema } from '@semantic-kernel/ai';
import { Kernel } from '../Kernel';
import { PromptTemplate } from '../promptTemplate';
import { KernelArguments } from './KernelArguments';
import { KernelFunction } from './KernelFunction';

export interface PromptRenderingContext<
  ReturnType = unknown,
  Schema extends JsonSchema = typeof DefaultJsonSchema,
  Args = FromSchema<Schema>,
> {
  function: KernelFunction<ReturnType, Schema, Args>;
  arguments: KernelArguments<Schema, Args>;
  kernel: Kernel;
  promptTemplate: PromptTemplate;
  renderedPrompt?: string;
}
