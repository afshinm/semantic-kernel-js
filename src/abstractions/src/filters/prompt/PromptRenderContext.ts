import { type ChatResponse } from '@semantic-kernel/ai';
import { type Kernel } from '../../Kernel';
import { type FunctionResult, type KernelArguments, type KernelFunction } from '../../functions';
import { type PromptExecutionSettings } from '../../promptExecutionSettings';

export interface PromptRenderContext {
  function: KernelFunction;
  arguments: KernelArguments;
  result?: FunctionResult<ChatResponse>;
  executionSettings?: PromptExecutionSettings;
  renderedPrompt?: string;
  isStreaming: boolean;
  kernel: Kernel;
}
