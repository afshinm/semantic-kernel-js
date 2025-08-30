import { ChatClient, ChatMessage, ChatResponse, ChatResponseUpdate } from '@semantic-kernel/ai';
import {
  Kernel,
  KernelArguments,
  KernelFunctionFromPrompt,
  PromptRenderingContext,
  PromptRenderingFilter,
} from '../../src';

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

describe('PromptRenderingFilter', () => {
  it('should call prompt rendering filters', async () => {
    // Arrange
    const kernel = getMockKernel();
    let filterCalled = false;
    const filter: PromptRenderingFilter = async (context: PromptRenderingContext, next) => {
      filterCalled = true;
      expect(context.function).toBeDefined();
      expect(context.arguments).toBeDefined();
      expect(context.kernel).toBe(kernel);
      expect(context.promptTemplate).toBeDefined();
      await next(context);
    };

    kernel.usePromptRendering(filter);

    const promptFunction = new KernelFunctionFromPrompt({
      prompt: 'Hello, {{name}}!',
    });

    // Act
    await promptFunction.invoke(kernel, new KernelArguments({ name: 'World' }));

    // Assert
    expect(filterCalled).toBe(true);
  });

  it('should allow filter to modify rendered prompt', async () => {
    // Arrange
    const kernel = getMockKernel();
    const customPrompt = 'Modified prompt content';

    const filter: PromptRenderingFilter = async (context: PromptRenderingContext, next) => {
      // Modify the rendered prompt in the filter
      context.renderedPrompt = customPrompt;
      await next(context);
    };

    kernel.usePromptRendering(filter);

    const promptFunction = new KernelFunctionFromPrompt({
      prompt: 'Original prompt: {{name}}',
    });

    // Act
    const result = (await promptFunction.invoke(kernel, new KernelArguments({ name: 'World' }))) as {
      value: ChatResponse;
      renderedPrompt: string;
    };

    // Assert
    expect(result.value.choices[0].text).toBe(`** ${customPrompt} **`);
  });

  it('should call multiple filters in order', async () => {
    // Arrange
    const kernel = getMockKernel();
    const callOrder: number[] = [];

    const filter1: PromptRenderingFilter = async (context: PromptRenderingContext, next) => {
      callOrder.push(1);
      await next(context);
      callOrder.push(4);
    };

    const filter2: PromptRenderingFilter = async (context: PromptRenderingContext, next) => {
      callOrder.push(2);
      await next(context);
      callOrder.push(3);
    };

    kernel.usePromptRendering(filter1);
    kernel.usePromptRendering(filter2);

    const promptFunction = new KernelFunctionFromPrompt({
      prompt: 'Hello, {{name}}!',
    });

    // Act
    await promptFunction.invoke(kernel, new KernelArguments({ name: 'World' }));

    // Assert
    expect(callOrder).toEqual([1, 2, 3, 4]);
  });
});
