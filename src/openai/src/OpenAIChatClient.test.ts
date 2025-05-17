import { OpenAIChatClient } from './OpenAIChatClient';

describe('OpenAIChatClient', () => {
  it('should create a new instance with an API key', () => {
    // Arrange
    const stubApiKey = 'stubApiKey';

    // Act
    const openAIClient = new OpenAIChatClient({ modelId: 'gpt-1', apiKey: stubApiKey });

    // Assert
    expect(openAIClient).toBeDefined();
  });
});
