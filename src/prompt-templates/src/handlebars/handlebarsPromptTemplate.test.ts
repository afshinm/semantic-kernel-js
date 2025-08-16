import {
  InputVariable,
  Kernel,
  KernelArguments,
  kernelFunction,
  PromptTemplateConfig,
} from '@semantic-kernel/abstractions';
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
});
