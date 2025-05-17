import { KernelFunctionMetadata } from '../functions';

export type PromptTemplateFormat = 'handlebars' | 'passthrough';

export type KernelFunctionFromPromptMetadata = KernelFunctionMetadata & {
  prompt: string;
  templateFormat: PromptTemplateFormat;
  inputVariables?: string[];
  allowDangerouslySetContent?: boolean;
};
