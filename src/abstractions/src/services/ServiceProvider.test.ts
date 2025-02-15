import { PromptExecutionSettings, ServiceId } from '../AI';
import { ChatClient, ChatClientMetadata, ChatCompletion, StreamingChatCompletionUpdate } from '../chatCompletion';
import { KernelArguments } from '../functions';
import { AIService, ModelIdKey } from './AIService';
import { MapServiceProvider } from './ServiceProvider';

class MockService implements AIService {
  readonly serviceType = 'ChatCompletion';
  readonly attributes: Map<string, string> = new Map();
}

class MockServiceWithModelId implements AIService {
  readonly serviceType = 'ChatCompletion';
  readonly attributes: Map<string, string>;

  constructor(modelId: string) {
    this.attributes = new Map([[ModelIdKey, modelId]]);
  }
}

class MyChatClient extends ChatClient {
  override complete(): Promise<ChatCompletion> {
    throw new Error('Method not implemented.');
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

describe('MapServiceProvider', () => {
  describe('addService', () => {
    it('should add a service', () => {
      // Arrange
      const serviceProvider = new MapServiceProvider();
      // const mockService = new MockService();

      // Act
      serviceProvider.addService(new MyChatClient());

      // Assert
      expect(
        serviceProvider.getService(ChatClient)
      ).toBeDefined();
    });

    it('should not add the same serviceKey twice', () => {
      // Arrange
      const serviceProvider = new MapServiceProvider();
      const mockService = new MockService();

      // Act
      serviceProvider.addService(mockService);

      // Assert
      expect(() => {
        serviceProvider.addService(mockService);
      }).toThrow('Service id "MockService" is already registered.');
    });
  });

  describe('trySelectAIService', () => {
    it('should return undefined when service is not defined', () => {
      // Arrange
      const serviceProvider = new MapServiceProvider();

      // Act
      const service = serviceProvider.trySelectAIService({
        serviceType: ChatClient,
      })?.service;

      // Assert
      expect(service).toBeUndefined();
    });

    it('should get a service without ExecutionSettings', () => {
      // Arrange
      const serviceProvider = new MapServiceProvider();
      const mockService = new MockService();
      serviceProvider.addService(mockService);

      // Act
      const service = serviceProvider.trySelectAIService({
        serviceType: ChatClient,
      });

      // Assert
      expect(service).toEqual({
        service: mockService,
        settings: undefined,
      });
    });

    it('should get a service with KernelArguments.ExecutionSettings and serviceKey', () => {
      // Arrange
      const stubServiceKey = 'MockServiceWithModelId';
      const stubPromptExecutionSettings = { modelId: 'gpt' };
      const stubExecutionSettings = new Map<ServiceId, PromptExecutionSettings>();
      stubExecutionSettings.set(stubServiceKey, stubPromptExecutionSettings);

      const stubKernelArguments = new KernelArguments({ executionSettings: stubExecutionSettings });

      const serviceProvider = new MapServiceProvider();

      const mockService1 = new MockService();
      serviceProvider.addService(mockService1);

      const mockService2 = new MockServiceWithModelId('MockModelId');
      serviceProvider.addService(mockService2);

      // Act
      const service = serviceProvider.trySelectAIService({
        serviceType: ChatClient,
        kernelArguments: stubKernelArguments,
      });

      // Assert
      expect(service?.service).toEqual(mockService2);
      expect(service?.executionSettings).toEqual(stubPromptExecutionSettings);
    });

    it('should get a service with KernelArguments.ExecutionSettings and modelId', () => {
      // Arrange
      const stubPromptExecutionSettings = { modelId: 'gpt' };
      const stubExecutionSettings = new Map<ServiceId, PromptExecutionSettings>();
      stubExecutionSettings.set('randomService', stubPromptExecutionSettings);

      const stubKernelArguments = new KernelArguments({ executionSettings: stubExecutionSettings });

      const serviceProvider = new MapServiceProvider();

      const mockService1 = new MockService();
      serviceProvider.addService(mockService1);

      const mockService2 = new MockServiceWithModelId(stubPromptExecutionSettings.modelId);
      serviceProvider.addService(mockService2);

      // Act
      const service = serviceProvider.trySelectAIService({
        serviceType: ChatClient,
        kernelArguments: stubKernelArguments,
      });

      // Assert
      expect(service?.service).toEqual(mockService2);
      expect(service?.executionSettings).toEqual(stubPromptExecutionSettings);
    });
  });
});
