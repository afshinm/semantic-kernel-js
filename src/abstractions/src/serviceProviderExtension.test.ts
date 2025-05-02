import { ChatClient } from '@semantic-kernel/ai';
import { MapServiceProvider } from '@semantic-kernel/service-provider';
import { kernelFunction } from './functions';
import { PromptExecutionSettings, ServiceId } from './promptExecutionSettings';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class MockBaseService {}

class MockService extends MockBaseService {
  readonly serviceType = 'ChatCompletion';
  readonly metadata = { name: '' };

  constructor(modelId: string = 'gpt') {
    super();
    this.metadata.name = modelId;
  }
}

class MockServiceWithModelId extends MockBaseService {
  readonly serviceType = 'ChatCompletion';
  readonly metadata = { modelId: '' };

  constructor(modelId: string) {
    super();
    this.metadata.modelId = modelId;
  }
}

describe('serviceProviderExtension', () => {
  describe('trySelectService', () => {
    it('should return undefined when service is not defined', () => {
      // Arrange
      const serviceProvider = new MapServiceProvider();

      // Act
      const service = serviceProvider.trySelectService({
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
      const service = serviceProvider.trySelectService({
        serviceType: MockService,
      });

      // Assert
      expect(service).toEqual({
        service: mockService,
        executionSettings: undefined,
      });
    });

    it('should get a service with KernelFunction.ExecutionSettings and serviceKey', () => {
      // Arrange
      const stubServiceKey = 'MockServiceWithModelId';
      const stubPromptExecutionSettings = { modelId: 'gpt' };
      const stubExecutionSettings = new Map<ServiceId, PromptExecutionSettings>();
      stubExecutionSettings.set(stubServiceKey, stubPromptExecutionSettings);

      const stubKernelFunction = kernelFunction(() => {}, {
        name: 'stubKernelFunction',
        executionSettings: stubExecutionSettings,
      });

      const serviceProvider = new MapServiceProvider();

      const mockService1 = new MockService();
      serviceProvider.addService(mockService1);

      const mockService2 = new MockServiceWithModelId('MockModelId');
      serviceProvider.addService(mockService2);

      // Act
      const service = serviceProvider.trySelectService({
        serviceType: MockBaseService,
        kernelFunction: stubKernelFunction,
      });

      // Assert
      expect(service?.service).toEqual(mockService2);
      expect(service?.executionSettings).toEqual(stubPromptExecutionSettings);
    });

    it('should get a service with KernelFunction.ExecutionSettings and modelId', () => {
      // Arrange
      const stubPromptExecutionSettings = { modelId: 'gpt' };
      const stubExecutionSettings = new Map<ServiceId, PromptExecutionSettings>();
      stubExecutionSettings.set('randomService', stubPromptExecutionSettings);

      const stubKernelFunction = kernelFunction(() => {}, {
        name: 'stubKernelFunction',
        executionSettings: stubExecutionSettings,
      });

      const serviceProvider = new MapServiceProvider();

      const mockService1 = new MockService();
      serviceProvider.addService(mockService1);

      const mockService2 = new MockServiceWithModelId(stubPromptExecutionSettings.modelId);
      serviceProvider.addService(mockService2);

      // Act
      const service = serviceProvider.trySelectService({
        serviceType: MockBaseService,
        kernelFunction: stubKernelFunction,
      });

      // Assert
      expect(service?.service).toEqual(mockService2);
      expect(service?.executionSettings).toEqual(stubPromptExecutionSettings);
    });
  });
});
