import { ChatPromptParser, KernelArguments } from '@semantic-kernel/abstractions';

export const registerKernelSystemHelpers = (handlebars: typeof Handlebars, variables: KernelArguments): void => {
  handlebars.registerHelper('set', function (...args: unknown[]) {
    // Accept both positional and hash arguments for set(name, value) or set name="foo" value="bar"
    let name: string | undefined;
    let value: unknown;

    // Check for hash params
    const options = args[args.length - 1] as Handlebars.HelperOptions;
    if (options && options.hash && typeof options.hash === 'object' && typeof options.hash.name === 'string') {
      name = options.hash.name;
      value = options.hash.value;
    }

    // Fallback to positional arguments if not found in hash
    if (!name && typeof args[0] === 'string') {
      name = args[0];
      value = args[1];
    }

    if (typeof name === 'string') {
      variables.arguments = { ...(variables.arguments ?? {}), [name]: value };
    }
    return '';
  });

  handlebars.registerHelper('get', function (...args: unknown[]) {
    // Support both positional (get(name)) and hash param (get name="foo")
    let varName: string | undefined;

    // Check for hash params
    const options = args[args.length - 1] as Handlebars.HelperOptions;
    if (options && options.hash && typeof options.hash === 'object' && typeof options.hash.name === 'string') {
      varName = options.hash.name;
    }

    if (!varName && typeof args[0] === 'string') {
      varName = args[0];
    }

    if (varName) {
      return variables.arguments?.[varName];
    }

    return '';
  });

  handlebars.registerHelper('message', function (args: { [key: string]: Handlebars.HelperDelegate }) {
    if (!(ChatPromptParser.RoleAttributeName in args.hash)) {
      throw new Error(`Message must have a "${ChatPromptParser.RoleAttributeName}"`);
    }

    let start = `<${ChatPromptParser.MessageTagName}`;
    for (const [key, value] of Object.entries(args.hash)) {
      start += ` ${key}="${value}"`;
    }
    start += '>';

    const end = `</${ChatPromptParser.MessageTagName}>`;

    return `${start}${args.fn(variables.arguments)}${end}`;
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

  handlebars.registerHelper('or', function (...args: unknown[]) {
    // Return the first truthy value or the last argument if none are truthy
    return args.slice(0, -1).find((v) => v);
  });

  handlebars.registerHelper('add', function (...args: unknown[]) {
    // Sum all numeric arguments
    return args.slice(0, -1).reduce((sum: number, value) => {
      const num = Number(value);
      return isNaN(num) ? sum : sum + num;
    }, 0);
  });

  handlebars.registerHelper('subtract', function (...args: unknown[]) {
    // Subtract all numeric arguments from the first one
    if (args.length < 2) {
      throw new Error('subtract helper requires at least two arguments');
    }
    const first = Number(args[0]);
    return args.slice(1, -1).reduce((result: number, value) => {
      const num = Number(value);
      return isNaN(num) ? result : result - num;
    }, first);
  });

  handlebars.registerHelper('equals', function (a: unknown, b: unknown) {
    // Check if two values are equal
    return a === b;
  });
};
