import { AzureOpenAI } from 'openai';
import { AzureOpenAIChatClient } from './AzureOpenAIChatClient';

describe('AzureOpenAIChatClient', () => {
  it('should create a new instance with Azure OpenAI configuration', () => {
    // Arrange
    const config = {
      apiKey: 'test-api-key',
      endpoint: 'https://test.openai.azure.com',
      deploymentName: 'gpt-35-turbo',
      apiVersion: '2024-06-01',
    };

    // Act
    const azureOpenAIClient = new AzureOpenAIChatClient(config);

    // Assert
    expect(azureOpenAIClient).toBeDefined();
    expect(azureOpenAIClient.metadata.providerName).toBe('azure-openai');
    expect(azureOpenAIClient.metadata.providerUri).toBe('https://test.openai.azure.com');
    expect(azureOpenAIClient.metadata.modelId).toBe('gpt-35-turbo');
  });

  it('should create a new instance with a pre-configured AzureOpenAI client', () => {
    // Arrange
    const mockAzureOpenAI = new AzureOpenAI({
      apiKey: 'test-key',
      endpoint: 'https://test.openai.azure.com',
      apiVersion: '2024-06-01',
    });

    const config = {
      endpoint: 'https://test.openai.azure.com',
      deploymentName: 'gpt-4',
      azureOpenAIClient: mockAzureOpenAI,
    };

    // Act
    const azureOpenAIClient = new AzureOpenAIChatClient(config);

    // Assert
    expect(azureOpenAIClient).toBeDefined();
    expect(azureOpenAIClient.metadata.providerName).toBe('azure-openai');
    expect(azureOpenAIClient.metadata.modelId).toBe('gpt-4');
  });

  it('should use default API version when not specified', () => {
    // Arrange
    const config = {
      apiKey: 'test-api-key',
      endpoint: 'https://test.openai.azure.com',
      deploymentName: 'gpt-35-turbo',
    };

    // Act
    const azureOpenAIClient = new AzureOpenAIChatClient(config);

    // Assert
    expect(azureOpenAIClient).toBeDefined();
    expect(azureOpenAIClient.metadata.providerName).toBe('azure-openai');
  });

  it('should return the AzureOpenAI service when requested', () => {
    // Arrange
    const config = {
      apiKey: 'test-api-key',
      endpoint: 'https://test.openai.azure.com',
      deploymentName: 'gpt-35-turbo',
    };
    const azureOpenAIClient = new AzureOpenAIChatClient(config);

    // Act
    const service = azureOpenAIClient.getService(AzureOpenAI);

    // Assert
    expect(service).toBeInstanceOf(AzureOpenAI);
  });

  it('should return the AzureOpenAIChatClient when requested', () => {
    // Arrange
    const config = {
      apiKey: 'test-api-key',
      endpoint: 'https://test.openai.azure.com',
      deploymentName: 'gpt-35-turbo',
    };
    const azureOpenAIClient = new AzureOpenAIChatClient(config);

    // Act
    const service = azureOpenAIClient.getService(AzureOpenAIChatClient);

    // Assert
    expect(service).toBe(azureOpenAIClient);
  });

  it('should return undefined for unknown service types', () => {
    // Arrange
    const config = {
      apiKey: 'test-api-key',
      endpoint: 'https://test.openai.azure.com',
      deploymentName: 'gpt-35-turbo',
    };
    const azureOpenAIClient = new AzureOpenAIChatClient(config);

    // Act
    const service = azureOpenAIClient.getService(String);

    // Assert
    expect(service).toBeUndefined();
  });

  it('should return undefined when serviceKey is provided', () => {
    // Arrange
    const config = {
      apiKey: 'test-api-key',
      endpoint: 'https://test.openai.azure.com',
      deploymentName: 'gpt-35-turbo',
    };
    const azureOpenAIClient = new AzureOpenAIChatClient(config);

    // Act
    const service = azureOpenAIClient.getService(AzureOpenAI, 'someKey');

    // Assert
    expect(service).toBeUndefined();
  });
});
