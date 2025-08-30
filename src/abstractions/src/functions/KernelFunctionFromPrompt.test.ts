import { ChatClient, ChatMessage, ChatResponse, ChatResponseUpdate } from '@semantic-kernel/ai';
import { Kernel } from '../Kernel';
import { PromptTemplateFormat } from '../promptTemplate';
import { FunctionResult } from './FunctionResult';
import { KernelFunctionFromPrompt } from './KernelFunctionFromPrompt';

class MockChatClient extends ChatClient {
  metadata = {};

  override getResponse(chatMessage: string | ChatMessage[]): Promise<ChatResponse> {
    return Promise.resolve(
      new ChatResponse({
        message: new ChatMessage({
          content: `** ${typeof chatMessage === 'string' ? chatMessage : chatMessage.join('.')} **`,
          role: 'assistant',
        }),
      })
    );
  }

  override getStreamingResponse(): AsyncGenerator<ChatResponseUpdate> {
    throw new Error('Method not implemented.');
  }
  override getService(): object | undefined {
    throw new Error('Method not implemented.');
  }
}

const getMockKernel = () => new Kernel().addService(new MockChatClient());

describe('kernelFunctionFromPrompt', () => {
  it('should render a prompt with a string template', async () => {
    // Arrange
    const mockKernel = getMockKernel();
    const prompt = 'testPrompt';

    // Act
    const result = (await new KernelFunctionFromPrompt({ prompt }).invoke(mockKernel)) as {
      value: ChatResponse;
      renderedPrompt: string;
    };

    // Assert
    expect(result.value.choices[0].text).toEqual('** testPrompt **');
    expect(result.renderedPrompt).toEqual('testPrompt');
  });

  it('should render a prompt with XML template', async () => {
    // Arrange
    const mockKernel = getMockKernel();
    const prompt = `<message role="user">Hello</message><message role="assistant">Hi there!</message>`;

    // Act
    const result = (await new KernelFunctionFromPrompt({ prompt }).invoke(mockKernel)) as {
      value: ChatResponse;
      renderedPrompt: string;
    };

    // Assert
    expect(result.value.choices[0].text).toEqual('** Hello.Hi there! **');
    expect(result.renderedPrompt).toEqual(prompt);
  });

  it('should throw an error if the template format is not supported', async () => {
    // Arrange
    const prompt = 'testPrompt';

    // Act, Assert
    expect(() => {
      new KernelFunctionFromPrompt({
        prompt,
        templateFormat: 'unsupported' as PromptTemplateFormat,
      });
    }).toThrow('unsupported template rendering not implemented');
  });

  it('should throw an error if no AIService is found', async () => {
    // Arrange
    const prompt = 'testPrompt';

    // Act
    const result = new KernelFunctionFromPrompt({
      prompt,
    });

    // Assert
    await expect(result.invoke(new Kernel())).rejects.toThrow('Service not found in kernel');
  });

  describe('PromptFilter', () => {
    it('should return the original prompt if no filters are applied', async () => {
      // Arrange
      const mockKernel = getMockKernel();
      const prompt = 'testPrompt';
      const kernelFunction = new KernelFunctionFromPrompt({ prompt });

      mockKernel.usePromptRender(async (context, next) => {
        await next(context);
      });

      // Act
      const result = await kernelFunction.invoke(mockKernel);

      // Assert
      expect(result.renderedPrompt).toEqual(prompt);
    });

    it('should modify the prompt before rendering', async () => {
      // Arrange
      const mockKernel = getMockKernel();
      const prompt = 'testPrompt';
      const expectedModifiedPrompt = 'modifiedPrompt';

      const kernelFunction = new KernelFunctionFromPrompt({ prompt });

      mockKernel.usePromptRender(async (context, next) => {
        await next(context);
        context.renderedPrompt = expectedModifiedPrompt;
      });

      // Act
      const result = await kernelFunction.invoke(mockKernel);

      // Assert
      expect(result.renderedPrompt).toEqual(expectedModifiedPrompt);
    });

    it('should not render any prompt if a filter does not call next()', async () => {
      // Arrange
      const mockKernel = getMockKernel();
      const prompt = 'testPrompt';

      const kernelFunction = new KernelFunctionFromPrompt({ prompt });

      mockKernel.usePromptRender(async () => {
        // Do not call next()
      });

      // Act, Assert
      await expect(kernelFunction.invoke(mockKernel)).rejects.toThrow('Rendered prompt is empty');
    });

    it('should return early if a filter sets the result', async () => {
      // Arrange
      const mockKernel = getMockKernel();
      const prompt = 'testPrompt';
      const stubMessage = new ChatMessage({ content: 'This is a response from the filter', role: 'assistant' });

      const kernelFunction = new KernelFunctionFromPrompt({ prompt });

      mockKernel.usePromptRender(async (context) => {
        context.renderedPrompt = 'This prompt will be ignored';
        context.result = {} as FunctionResult<ChatResponse>;
        context.result.value = new ChatResponse({
          message: stubMessage,
        });
      });

      // Act
      const result = (await kernelFunction.invoke(mockKernel)) as { value: ChatResponse; renderedPrompt?: string };

      // Assert
      expect(result.value.choices[0].text).toEqual('This is a response from the filter');
      expect(result.value.choices[0].role).toEqual('assistant');
    });
  });
});
