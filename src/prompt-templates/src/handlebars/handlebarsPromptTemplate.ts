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
import { registerKernelSystemHelpers } from './kernelSystemHelpers';

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
   * Prefix separator for helper names.
   */
  prefixSeparator?: string;
};

export class HandlebarsPromptTemplate implements PromptTemplate {
  private readonly handlebars: typeof Handlebars;
  private readonly handlebarsTemplate: Handlebars.TemplateDelegate;

  constructor(
    private readonly promptConfig: PromptTemplateConfig,
    private readonly options: HandlebarsPromptTemplateOptions = {
      prefixSeparator: '-',
    }
  ) {
    this.handlebars = Handlebars.create();
    this.handlebarsTemplate = this.handlebars.compile(promptConfig.prompt, {
      noEscape: true, // We handle escaping in the async helper
    });
  }

  async render(kernel: Kernel, args: KernelArguments) {
    registerKernelSystemHelpers(this.handlebars, args);

    // First pass: compile the template with placeholders
    // This is a hacky solution to ensure the helpers that modify the KernelArguments are executed
    // before the template is compiled.
    this.handlebarsTemplate(args.arguments);

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
            return (await pluginFunction.invoke(kernel, new KernelArguments(helperArgs))).value;
          }
        );
      }
    }

    return await renderWithAsyncHelpers(this.handlebarsTemplate, this.getVariables(args));
  }

  getVariables(args: KernelArguments): KernelArguments {
    const result: Record<string, unknown> = {
      ...(args.arguments ?? {}),
    };

    for (const inputVariable of this.promptConfig.inputVariables) {
      if (inputVariable.default !== undefined && inputVariable.default !== null) {
        result[inputVariable.name] = inputVariable.default;
      }
    }

    for (const [key, value] of Object.entries(args.arguments ?? {})) {
      if (value) {
        let processedValue: unknown = value;

        if (this.shouldEncodeTags(this.promptConfig, key, value)) {
          processedValue = htmlEscape(value);
        }

        result[key] = processedValue;
      }
    }

    args.arguments = result;
    return args;
  }

  private shouldEncodeTags(
    promptTemplateConfig: PromptTemplateConfig,
    propertyName: string,
    propertyValue: unknown
  ): propertyValue is string {
    if (propertyValue === null || typeof propertyValue !== 'string' || this.promptConfig.allowDangerouslySetContent) {
      return false;
    }

    const inputVariable = promptTemplateConfig.inputVariables.find((input) => input.name === propertyName);
    return inputVariable ? !inputVariable.allowDangerouslySetContent : true;
  }
}
