import { ChatClient, ChatMessage, ChatResponse, ChatResponseUpdate } from '@semantic-kernel/ai';
import { Kernel } from '../Kernel';
import { PromptTemplateFormat } from '../promptTemplate';
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
});
