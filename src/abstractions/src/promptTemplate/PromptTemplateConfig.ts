import { KernelFunctionMetadata } from '../functions';
import { AIFunctionParameterMetadata } from '../functions/AIFunctionParameterMetadata';

export type PromptTemplateFormat = 'handlebars' | 'passthrough';

export type KernelFunctionFromPromptMetadata<
  PARAMETERS extends AIFunctionParameterMetadata = AIFunctionParameterMetadata,
> = KernelFunctionMetadata<PARAMETERS> & {
  templateFormat: PromptTemplateFormat;
  template: string;
  inputVariables?: string[];
  allowDangerouslySetContent?: boolean;
};
