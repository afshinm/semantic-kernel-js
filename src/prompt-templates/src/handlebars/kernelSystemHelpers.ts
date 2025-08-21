import { KernelArguments } from '@semantic-kernel/abstractions';

export const registerKernelSystemHelpers = (handlebars: typeof Handlebars, variables: KernelArguments): void => {
  handlebars.registerHelper('set', function (name: string, value: unknown) {
    // Positional arguments: set(name, value)
    if (typeof name === 'string' && value) {
      variables.arguments = { ...(variables.arguments ?? {}), [name]: value };
    }
    return '';
  });

  handlebars.registerHelper('get', function (name: string) {
    // Positional arguments: get(name)
    if (typeof name === 'string') {
      return variables.arguments[name] ?? '';
    }
    return '';
  });

  handlebars.registerHelper('message', function (args: { [key: string]: Handlebars.HelperDelegate }) {
    if (!('role' in args.hash)) {
      throw new Error('Message must have a "role"');
    }

    let start = '<message';
    for (const [key, value] of Object.entries(args.hash)) {
      start += ` ${key}="${value}"`;
    }
    start += '>';

    const end = '</message>';

    return `${start}${args.fn()}${end}`;
  });

  handlebars.registerHelper('concat', function (...args: unknown[]) {
    // Concatenate all arguments into a single string
    return args.slice(0, -1).join('');
  });

  handlebars.registerHelper('array', function (...args: unknown[]) {
    // Create an array from the arguments
    return args.slice(0, -1);
  });

  handlebars.registerHelper('json', function (value: unknown) {
    // Convert the value to a JSON string
    return JSON.stringify(value);
  });

  handlebars.registerHelper('range', function (start: number, end: number) {
    // Create an array of numbers from start to end (inclusive)
    const result: number[] = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  });
};
