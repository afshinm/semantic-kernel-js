import { KernelArguments, kernelFunction } from '../../functions';
import { ChatPromptParser } from '../../internalUtilities';
import { Kernel } from '../../Kernel';
import { InputVariable } from '../InputVariable';
import { PromptTemplateConfig } from '../PromptTemplateConfig';
import { HandlebarsPromptTemplate } from './handlebarsPromptTemplate';

describe('HandlebarsPromptTemplate', () => {
  it('should render the template with a single argument function', async () => {
    // Arrange
    const kernel = new Kernel();

    const greeting = kernelFunction(
      ({ name }) => {
        return `Greetings, ${name}!`;
      },
      {
        name: 'greeting',
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          required: ['name'],
        } as const,
      }
    );

    kernel.addPlugin({
      name: 'TestPlugin',
      description: 'A test plugin',
      functions: [greeting],
    });

    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hey, {{TestPlugin-greeting name="John"}}',
      templateFormat: 'handlebars',
    });

    // Act
    const template = new HandlebarsPromptTemplate(promptTemplateConfig);
    const result = await template.render(kernel, new KernelArguments());

    // Assert
    expect(result).toBe('Hey, Greetings, John!');
  });

  it('should render the template with a multiple argument function', async () => {
    // Arrange
    const kernel = new Kernel();

    const userInfo = kernelFunction(
      ({ firstName, lastName, age }) => {
        return `${firstName} ${lastName} ${age}!`;
      },
      {
        name: 'userInfo',
        schema: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
          },
          required: ['firstName', 'lastName', 'age'],
        } as const,
      }
    );

    kernel.addPlugin({
      name: 'TestPlugin',
      description: 'A test plugin',
      functions: [userInfo],
    });

    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hey, Your info: {{TestPlugin-userInfo firstName="John" lastName="Doe" age=30}}',
      templateFormat: 'handlebars',
    });

    // Act
    const template = new HandlebarsPromptTemplate(promptTemplateConfig);
    const result = await template.render(kernel, new KernelArguments());

    // Assert
    expect(result).toBe('Hey, Your info: John Doe 30!');
  });

  it('should render the template with the given arguments', async () => {
    // Arrange
    const kernel = new Kernel();
    const args = new KernelArguments({ name: 'John' });
    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hello, {{name}}!',
      templateFormat: 'handlebars',
    });

    const template = new HandlebarsPromptTemplate(promptTemplateConfig);

    // Act
    const result = await template.render(kernel, args);

    // Assert
    expect(result).toBe('Hello, John!');
  });

  it('should render the template with async helpers', async () => {
    // Arrange
    const kernel = new Kernel();

    const asyncGreeting = kernelFunction(
      async ({ name }) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(`Async Greetings, ${name}!`), 100);
        });
      },
      {
        name: 'asyncGreeting',
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          required: ['name'],
        } as const,
      }
    );

    kernel.addPlugin({
      name: 'TestPlugin',
      description: 'A test plugin',
      functions: [asyncGreeting],
    });

    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hey, {{TestPlugin-asyncGreeting name="John"}}',
      templateFormat: 'handlebars',
    });

    // Act
    const template = new HandlebarsPromptTemplate(promptTemplateConfig);
    const result = await template.render(kernel, new KernelArguments());

    // Assert
    expect(result).toBe('Hey, Async Greetings, John!');
  });

  it('should handle missing arguments gracefully', async () => {
    // Arrange
    const kernel = new Kernel();
    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hello, {{name}}!',
      templateFormat: 'handlebars',
    });

    const template = new HandlebarsPromptTemplate(promptTemplateConfig);

    // Act
    const result = await template.render(kernel, new KernelArguments());

    // Assert
    expect(result).toBe('Hello, !'); // Should handle missing name gracefully
  });

  it('should encode HTML tags in arguments', async () => {
    // Arrange
    const kernel = new Kernel();
    const args = new KernelArguments({ name: '<John>' });
    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hello, {{name}}!',
      templateFormat: 'handlebars',
    });

    const template = new HandlebarsPromptTemplate(promptTemplateConfig);

    // Act
    const result = await template.render(kernel, args);

    // Assert
    expect(result).toBe('Hello, &lt;John&gt;!');
  });

  it('should not encode HTML tags for non-string arguments', async () => {
    // Arrange
    const kernel = new Kernel();
    const args = new KernelArguments({ age: 30 });
    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Your age is {{age}}.',
      templateFormat: 'handlebars',
    });

    const template = new HandlebarsPromptTemplate(promptTemplateConfig);

    // Act
    const result = await template.render(kernel, args);

    // Assert
    expect(result).toBe('Your age is 30.');
  });

  it('should not encode HTML tags when InputVariable has encodeTags set to false', async () => {
    // Arrange
    const kernel = new Kernel();
    const args = new KernelArguments({ name: '<John>', job: '<b>Developer</b>' });
    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hello, {{name}}. Your job is {{job}}!',
      templateFormat: 'handlebars',
      inputVariables: [new InputVariable({ name: 'name', allowDangerouslySetContent: true })],
    });

    const template = new HandlebarsPromptTemplate(promptTemplateConfig);

    // Act
    const result = await template.render(kernel, args);

    // Assert
    expect(result).toBe('Hello, <John>. Your job is &lt;b&gt;Developer&lt;/b&gt;!');
  });

  it('should not escape HTML tags in the template', async () => {
    // Arrange
    const kernel = new Kernel();
    const args = new KernelArguments({ name: 'John' });
    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hello, <b>{{name}}</b>!',
      templateFormat: 'handlebars',
    });

    const template = new HandlebarsPromptTemplate(promptTemplateConfig);

    // Act
    const result = await template.render(kernel, args);

    // Assert
    expect(result).toBe('Hello, <b>John</b>!');
  });

  it('should read the default value from InputVariable', async () => {
    // Arrange
    const kernel = new Kernel();
    const promptTemplateConfig = new PromptTemplateConfig({
      prompt: 'Hello, {{name}}!',
      templateFormat: 'handlebars',
      inputVariables: [new InputVariable({ name: 'name', defaultValue: 'Default Name' })],
    });

    const template = new HandlebarsPromptTemplate(promptTemplateConfig);

    // Act
    const result = await template.render(kernel, new KernelArguments());

    // Assert
    expect(result).toBe('Hello, Default Name!');
  });

  describe('set helper', () => {
    it('should set variables using the set helper', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{set "name" "John"}}Hello, {{name}}!',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('Hello, John!');
    });

    it('should set variable using hash params', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{set name="name" value="John"}}Hello, {{get "name"}}!',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);
      // Act

      const result = await template.render(kernel, new KernelArguments());
      // Assert
      expect(result).toBe('Hello, John!');
    });

    it('should set variables and pass to the plugin function', async () => {
      // Arrange
      const kernel = new Kernel();

      const greeting = kernelFunction(
        ({ name }) => {
          return `Greetings, ${name}!`;
        },
        {
          name: 'greeting',
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
            required: ['name'],
          } as const,
        }
      );

      kernel.addPlugin({
        name: 'TestPlugin',
        description: 'A test plugin',
        functions: [greeting],
      });

      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{set "name" "John"}}Hey, {{TestPlugin-greeting name=name}}',
        templateFormat: 'handlebars',
      });

      // Act
      const template = new HandlebarsPromptTemplate(promptTemplateConfig);
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('Hey, Greetings, John!');
    });
  });

  describe('get helper', () => {
    it('should get variables using the get helper', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: 'Hello, {{get "name"}}!',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments({ name: 'John' }));

      // Assert
      expect(result).toBe('Hello, John!');
    });

    it('should get variables using the get helper after set', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{set "name" "John"}}Hello, {{get "name"}}!',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('Hello, John!');
    });

    it('should get variables using hash params', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{set name="name" value="John"}}Hello, {{get name="name"}}!',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('Hello, John!');
    });
  });

  describe('message helper', () => {
    it('should create a message tag with role', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{#message role="user"}}Hello{{/message}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('<message role="user">Hello</message>');
    });

    it('should create a message tag with multiple attributes', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{#message role="user" author="John"}}content{{/message}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('<message author="John" role="user">content</message>');
    });

    it('should throw an error if role is missing', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{message author="John"}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act & Assert
      await expect(template.render(kernel, new KernelArguments())).rejects.toThrow('Message must have a "role"');
    });

    it('should encode HTML tags in message content', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt:
          '{{#message role="user"}}{{unsafe_input}}{{/message}}{{#message role="system"}}{{safe_input}}{{/message}}',
        templateFormat: 'handlebars',
        inputVariables: [
          new InputVariable({
            name: 'unsafe_input',
            allowDangerouslySetContent: false,
          }),
          new InputVariable({
            name: 'safe_input',
            allowDangerouslySetContent: true,
          }),
        ],
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(
        kernel,
        new KernelArguments({
          safe_input: '<b>World</b>',
          unsafe_input: '<script>alert("Hello World")</script>',
        })
      );

      // Assert
      expect(result).toBe(
        '<message role="user">&lt;script&gt;alert(&quot;Hello World&quot;)&lt;/script&gt;</message>' +
          '<message role="system"><b>World</b></message>'
      );
    });

    it('should append message and parse it correctly', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{#message role="user"}}Hello{{/message}}{{#message role="assistant"}}Hi!{{/message}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());
      const chatHistory = ChatPromptParser.tryParse(result); // This will throw if the parsing fails

      // Assert
      expect(chatHistory).toBeDefined();
      expect(chatHistory?.length).toBe(2);
      expect(chatHistory?.[0].role).toBe('user');
      expect(chatHistory?.[0].text).toBe('Hello');
      expect(chatHistory?.[1].role).toBe('assistant');
      expect(chatHistory?.[1].text).toBe('Hi!');
    });
  });

  describe('concat helper', () => {
    it('should concatenate multiple strings', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{concat "Hello, " name "!"}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments({ name: 'John' }));

      // Assert
      expect(result).toBe('Hello, John!');
    });

    it('should concatenate multiple arguments', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{concat "Hello, " name ", you are " age " years old!"}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(
        kernel,
        new KernelArguments({
          name: 'John',
          age: 30,
        })
      );

      // Assert
      expect(result).toBe('Hello, John, you are 30 years old!');
    });
  });

  describe('array helper', () => {
    it('should create an array from multiple arguments', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{#each (array "apple" "banana" "cherry")}}<item>{{this}}</item>{{/each}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('<item>apple</item><item>banana</item><item>cherry</item>');
    });
  });

  describe('json helper', () => {
    it('should convert an object to JSON string', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{json person}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments({ person: { name: 'John', age: 30 } }));

      // Assert
      expect(result).toBe('{"name":"John","age":30}');
    });

    it('should set and get variables using json helper', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{set "age" 20}}Age is {{json age}}!',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('Age is 20!');
    });
  });

  describe('range helper', () => {
    it('should create a range of numbers', async () => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{#each (range 1 5)}}<number>{{this}}</number>{{/each}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments());

      // Assert
      expect(result).toBe('<number>1</number><number>2</number><number>3</number><number>4</number><number>5</number>');
    });
  });

  describe('or helper', () => {
    test.each([
      [{ value1: '', value2: 'default' }, 'default'],
      [{ value1: false, value2: 'default' }, 'default'],
      [{ value1: true, value2: true }, 'true'],
      [{ value1: false, value2: true }, 'true'],
      [{ value1: null, value2: true }, 'true'],
      [{ value1: null, value2: undefined }, ''],
    ])('should return the default value if all are falsy', async (values, expected) => {
      // Arrange
      const kernel = new Kernel();
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{or value1 value2}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(kernel, new KernelArguments(values));

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('add helper', () => {
    it('should add two floating point numbers', async () => {
      // Arrange
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{add 2.5 3.5}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(new Kernel(), new KernelArguments());

      // Assert
      expect(result).toBe('6');
    });
  });

  describe('subtract helper', () => {
    it('should subtract two numbers', async () => {
      // Arrange
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{subtract 10 3}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(new Kernel(), new KernelArguments());

      // Assert
      expect(result).toBe('7');
    });
  });

  describe('equals helper', () => {
    test.each([
      [1, 1, true],
      [1, 2, false],
      ['test', 'test', true],
      ['test', 'TEST', false],
    ])('should return true if two values are equal', async (a, b, expected) => {
      // Arrange
      const promptTemplateConfig = new PromptTemplateConfig({
        prompt: '{{equals a b}}',
        templateFormat: 'handlebars',
      });

      const template = new HandlebarsPromptTemplate(promptTemplateConfig);

      // Act
      const result = await template.render(new Kernel(), new KernelArguments({ a, b }));

      // Assert
      expect(result).toBe(expected.toString());
    });
  });
});
