import {
  ChatClient,
  ChatClientMetadata,
  ChatCompletion,
  ChatMessage,
  StreamingChatCompletionUpdate,
} from 'semantic-kernel';

export class MockChatClient extends ChatClient {
  override complete(chatMessage: string): Promise<ChatCompletion> {
    return Promise.resolve(
      new ChatCompletion({ message: new ChatMessage({ content: `** ${chatMessage} **`, role: 'assistant' }) })
    );
  }

  override completeStreaming(): AsyncGenerator<StreamingChatCompletionUpdate> {
    throw new Error('Method not implemented.');
  }
  override get metadata(): ChatClientMetadata {
    throw new Error('Method not implemented.');
  }
  override getService(): object | undefined {
    throw new Error('Method not implemented.');
  }
}
