import { ChatClient, type Constructor } from './ChatClient';
import { type ChatClientMetadata } from './ChatClientMetadata';
import { ChatResponse } from './ChatResponse';
import { type ChatResponseUpdate } from './ChatResponseUpdate';
import { DelegatingChatClient } from './DelegatingChatClient';

class StubChatClient extends ChatClient {
  override getResponse(): Promise<ChatResponse> {
    throw new Error('Method not implemented.');
  }
  override getStreamingResponse(): AsyncGenerator<ChatResponseUpdate> {
    throw new Error('Method not implemented.');
  }
  override get metadata(): ChatClientMetadata {
    throw new Error('Method not implemented.');
  }
  override getService<T extends Constructor>(): InstanceType<T> | undefined {
    if (this.constructor === StubChatClient) {
      return this as unknown as InstanceType<T>;
    }
  }
}

class StubDelegatingChatClient extends DelegatingChatClient {
  constructor() {
    super(new StubChatClient());
  }

  override getResponse(): Promise<ChatResponse> {
    return Promise.resolve(new ChatResponse());
  }
}

class AnotherSubDelegatingChatClient extends DelegatingChatClient {
  constructor() {
    super(new StubDelegatingChatClient());
  }

  override getResponse(): Promise<ChatResponse> {
    return Promise.resolve(new ChatResponse());
  }
}

describe('DelegatingChatClient', () => {
  it('should get the service when it matches the client type', () => {
    // Arrange
    const stubDelegatingChatClient = new StubDelegatingChatClient();

    // Act
    const service = stubDelegatingChatClient.getService(StubDelegatingChatClient);

    // Assert
    expect(service).toBeInstanceOf(StubDelegatingChatClient);
  });

  it('should return return service from the inner client', () => {
    // Arrange
    const stubDelegatingChatClient = new StubDelegatingChatClient();

    // Act
    const service = stubDelegatingChatClient.getService(StubChatClient);

    // Assert
    expect(service).toBeInstanceOf(StubChatClient);
  });

  it('should return service type from two level delegation', () => {
    // Arrange
    const stubDelegatingChatClient = new AnotherSubDelegatingChatClient();

    // Act, Assert
    expect(stubDelegatingChatClient.getService(StubDelegatingChatClient)).toBeInstanceOf(StubDelegatingChatClient);
    expect(stubDelegatingChatClient.getService(AnotherSubDelegatingChatClient)).toBeInstanceOf(
      AnotherSubDelegatingChatClient
    );
  });
});
