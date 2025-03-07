import { AIFunctionParameterMetadata } from '@semantic-kernel/ai';
import { KernelFunctionMetadata } from '../functions';

export type PromptTemplateFormat = 'handlebars' | 'passthrough';

export type KernelFunctionFromPromptMetadata<
  PARAMETERS extends AIFunctionParameterMetadata = AIFunctionParameterMetadata,
> = KernelFunctionMetadata<PARAMETERS> & {
  templateFormat: PromptTemplateFormat;
  template: string;
  inputVariables?: string[];
  allowDangerouslySetContent?: boolean;
};
