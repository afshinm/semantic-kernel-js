import {
  FunctionName,
  Kernel,
  KernelArguments,
  PromptTemplate,
  PromptTemplateConfig,
} from '@semantic-kernel/abstractions';
import Handlebars from 'handlebars';
import { htmlEscape } from '../htmlEscape';
import { registerAsyncHelper, renderWithAsyncHelpers } from './asyncHelpers';

export type HandlebarsPromptTemplateOptions = {
  /**
   * Callback to register custom Handlebars helpers.
   *
   * This callback allows users to register their custom helpers while ensuring that they don't conflict with existing system or custom helpers.
   * Users should use the provided `registerHelper` callback when registering their custom helpers.
   */
  registerCustomHelpers?: (
    registerHelper: (name: string, helper: Handlebars.HelperDelegate) => void,
    options: HandlebarsPromptTemplateOptions,
    variables: KernelArguments
  ) => void;

  /**
   * Flag indicating whether to enable HTML decoding of the rendered template.
   */
  enableHtmlDecoder?: boolean;

  /**
   * Prefix separator for helper names.
   */
  prefixSeparator?: string;
};

export class HandlebarsPromptTemplate implements PromptTemplate {
  private readonly handlebars: typeof Handlebars;

  constructor(
    private readonly promptConfig: PromptTemplateConfig,
    private readonly options: HandlebarsPromptTemplateOptions = {
      enableHtmlDecoder: true,
      prefixSeparator: '-',
    }
  ) {
    this.handlebars = Handlebars.create();
  }

  async render(kernel: Kernel, args: KernelArguments) {
    // Register all functions from the kernel plugins as Handlebars helpers
    for (const plugin of kernel.plugins.getPlugins()) {
      for (const [functionName, pluginFunction] of plugin.functions.entries()) {
        registerAsyncHelper(
          this.handlebars,
          FunctionName.fullyQualifiedName({
            functionName,
            pluginName: plugin.name,
            nameSeparator: this.options.prefixSeparator,
          }),
          async (helperArgs) => {
            const args = new KernelArguments(helperArgs);
            return (await pluginFunction.invoke(kernel, args)).value;
          }
        );
      }
    }

    const template = renderWithAsyncHelpers(this.handlebars, this.promptConfig.prompt, this.getVariables(args));

    return template;
  }

  getVariables(args?: KernelArguments): KernelArguments {
    const result: Record<string, unknown> = {};

    for (const inputVariable of this.promptConfig.inputVariables) {
      if (inputVariable.default !== undefined && inputVariable.default !== null) {
        result[inputVariable.name] = inputVariable.default;
      }
    }

    if (args) {
      for (const [key, value] of Object.entries(args.arguments ?? {})) {
        if (value !== null) {
          let processedValue = value;

          if (this.shouldEncodeTags(this.promptConfig, key, value)) {
            processedValue = htmlEscape(value);
          }

          result[key] = processedValue;
        }
      }
    }

    return new KernelArguments(result);
  }

  private shouldEncodeTags(
    promptTemplateConfig: PromptTemplateConfig,
    propertyName: string,
    propertyValue: unknown
  ): boolean {
    if (propertyValue === null || typeof propertyValue !== 'string' || this.promptConfig.allowDangerouslySetContent) {
      return false;
    }

    const inputVariable = promptTemplateConfig.inputVariables.find((input) => input.name === propertyName);
    return inputVariable ? !inputVariable.allowDangerouslySetContent : true;
  }
}
