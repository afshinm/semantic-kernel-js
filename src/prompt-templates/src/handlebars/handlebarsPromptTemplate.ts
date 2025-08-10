import { Kernel, KernelArguments, PromptTemplate, PromptTemplateConfig } from '@semantic-kernel/abstractions';
import Handlebars from 'handlebars';
import { registerAsyncHelper, renderWithAsyncHelpers } from './asyncHelpers';

export class HandlebarsPromptTemplate implements PromptTemplate {
  private readonly handlebars: typeof Handlebars;
  constructor(private readonly promptConfig: PromptTemplateConfig) {
    this.handlebars = Handlebars.create();
  }

  async render(kernel: Kernel, args: KernelArguments) {
    // Register all functions from the kernel plugins as Handlebars helpers
    for (const plugin of kernel.plugins.getPlugins()) {
      for (const [functionName, pluginFunction] of plugin.functions.entries()) {
        registerAsyncHelper(this.handlebars, functionName, async (helperArgs) => {
          const args = new KernelArguments(helperArgs);
          return (await pluginFunction.invoke(kernel, args)).value;
        });
      }
    }

    const template = renderWithAsyncHelpers(this.handlebars, this.promptConfig.prompt, args);

    return template;
  }
}
