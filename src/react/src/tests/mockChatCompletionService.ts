import { ChatClient, ChatClientMetadata, ChatMessage, ChatResponse, ChatResponseUpdate } from 'semantic-kernel';

export class MockChatClient extends ChatClient {
  override complete(chatMessage: string): Promise<ChatResponse> {
    return Promise.resolve(
      new ChatResponse({ message: new ChatMessage({ content: `** ${chatMessage} **`, role: 'assistant' }) })
    );
  }

  override completeStreaming(): AsyncGenerator<ChatResponseUpdate> {
    throw new Error('Method not implemented.');
  }
  override get metadata(): ChatClientMetadata {
    throw new Error('Method not implemented.');
  }
  override getService(): object | undefined {
    throw new Error('Method not implemented.');
  }
}
