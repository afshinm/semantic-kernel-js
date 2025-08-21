import { Kernel, KernelArguments } from '@semantic-kernel/abstractions';

export const registerKernelSystemHelpers = (
  handlebars: typeof Handlebars,
  kernel: Kernel,
  variables: KernelArguments
): void => {
  handlebars.registerHelper('set', function (name: string, value: unknown, options: Handlebars.HelperOptions) {
    // Positional arguments: set(name, value)
    if (typeof name === 'string' && value !== undefined) {
      variables.arguments = { ...(variables.arguments ?? {}), [name]: value };
    }
    return '';
  });
};
