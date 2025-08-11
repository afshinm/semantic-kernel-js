import {
  FunctionName,
  Kernel,
  KernelArguments,
  PromptTemplate,
  PromptTemplateConfig,
} from '@semantic-kernel/abstractions';
import Handlebars from 'handlebars';
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

    const template = renderWithAsyncHelpers(this.handlebars, this.promptConfig.prompt, args);

    return template;
  }
}
