import { Kernel, KernelArguments, PromptTemplate, PromptTemplateConfig } from '@semantic-kernel/abstractions';
import Handlebars from 'handlebars';

type AsyncHelper = (...args: unknown[]) => Promise<unknown> | unknown;

const asyncValueRegistry = new Map<string, Promise<unknown>>();
let asyncCounter = 0;

/**
 * Register an async helper in two-pass mode.
 * In the first pass, it returns a unique placeholder.
 * In the second pass, that placeholder gets replaced with awaited result.
 */
function registerAsyncHelper(handlebars: typeof Handlebars, name: string, fn: AsyncHelper) {
  handlebars.registerHelper(name, (context) => {
    if (typeof(context) !== 'object' || !context.hash) {
      throw new Error(`Invalid context for async helper "${name}": ${JSON.stringify(context)}`);
    }
    const placeholder = `__ASYNC_HELPER_${name}_${asyncCounter++}__`;

    // Store the promise for the second pass
    asyncValueRegistry.set(
      placeholder,
      (async () => {
        const res = await fn(context.hash) as string;
        return handlebars.Utils.escapeExpression(res ?? '');
      })()
    );

    return placeholder;
  });
}

/**
 * Render with two passes:
 * - First pass runs Handlebars synchronously and produces placeholders for async helpers.
 * - Second pass resolves those placeholders and replaces them.
 */
async function renderWithAsyncHelpers(
  handlebars: typeof Handlebars,
  templateSrc: string,
  context: unknown
): Promise<string> {
  asyncValueRegistry.clear();

  const compiled = handlebars.compile(templateSrc);
  let output = compiled(context);

  // Wait for all async values
  const replacements = await Promise.all(asyncValueRegistry.values());
  const keys = Array.from(asyncValueRegistry.keys());

  // Replace placeholders in output
  keys.forEach((placeholder, i) => {
    output = output.split(placeholder).join(String(replacements[i]));
  });

  return output;
}


export class HandlebarsPromptTemplate implements PromptTemplate {
  private readonly handlebars: typeof Handlebars;
  constructor(private readonly promptConfig: PromptTemplateConfig) {
    this.handlebars = Handlebars.create();
  }

  async render(kernel: Kernel, args: KernelArguments) {
    for (const plugin of kernel.plugins.getPlugins()) {
      for (const [functionName, pluginFunction] of plugin.functions.entries()) {

        registerAsyncHelper(this.handlebars, functionName, async (helperArgs) => {
          const args = new KernelArguments(helperArgs);
          return (await pluginFunction.invoke(kernel, args)).value;
        });

      }
    }

    const template = renderWithAsyncHelpers(this.handlebars, this.promptConfig.prompt, args);
    // TODO: add Kernel plugins as helpers

    return template;
  }
}
