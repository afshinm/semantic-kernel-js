import { Kernel, KernelArguments, kernelFunction, PromptTemplateConfig } from '@semantic-kernel/abstractions';
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
});
