import { ChatClient, ChatMessage, ChatResponse, ChatResponseUpdate } from '@semantic-kernel/ai';
import { Kernel } from '../Kernel';
import { PromptTemplateFormat } from '../promptTemplate';
import { KernelFunctionFromPrompt } from './KernelFunctionFromPrompt';

class MockChatClient extends ChatClient {
  metadata = {};

  override complete(chatMessage: string): Promise<ChatResponse> {
    return Promise.resolve(
      new ChatResponse({ message: new ChatMessage({ content: `** ${chatMessage} **`, role: 'assistant' }) })
    );
  }

  override completeStreaming(): AsyncGenerator<ChatResponseUpdate> {
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
    const result = (await KernelFunctionFromPrompt.create(prompt, {}).invoke(mockKernel)) as {
      value: ChatResponse;
      renderedPrompt: string;
    };

    // Assert
    expect(result.value.choices[0].text).toEqual('** testPrompt **');
    expect(result.renderedPrompt).toEqual('testPrompt');
  });

  it('should throw an error if the template format is not supported', async () => {
    // Arrange
    const mockKernel = getMockKernel();
    const prompt = 'testPrompt';

    // Act
    const result = KernelFunctionFromPrompt.create(prompt, {
      templateFormat: 'unsupported' as PromptTemplateFormat,
    });

    // Assert
    await expect(result.invoke(mockKernel)).rejects.toThrow('unsupported template rendering not implemented');
  });

  it('should throw an error if no AIService is found', async () => {
    // Arrange
    const prompt = 'testPrompt';

    // Act
    const result = KernelFunctionFromPrompt.create(prompt, {});

    // Assert
    await expect(result.invoke(new Kernel())).rejects.toThrow('Service not found in kernel');
  });
});
