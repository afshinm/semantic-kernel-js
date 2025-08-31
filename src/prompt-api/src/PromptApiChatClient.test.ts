import { ChatMessage, TextContent } from '@semantic-kernel/ai';
import { PromptApiChatClient } from './PromptApiChatClient';
import { PromptApiOptions } from './PromptApiOptions';

// Mock fetch for testing
global.fetch = jest.fn();

describe('PromptApiChatClient', () => {
  const mockOptions: PromptApiOptions = {
    baseUrl: 'https://api.example.com',
    apiKey: 'test-api-key',
  };

  let client: PromptApiChatClient;

  beforeEach(() => {
    client = new PromptApiChatClient(mockOptions);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a client with correct metadata', () => {
      expect(client.metadata.providerName).toBe('prompt-api');
      expect(client.metadata.providerUri).toBe(mockOptions.baseUrl);
      expect(client.metadata.modelId).toBe('prompt-api-client');
    });
  });

  describe('getService', () => {
    it('should return itself for PromptApiChatClient type', () => {
      const service = client.getService(PromptApiChatClient);
      expect(service).toBe(client);
    });

    it('should return undefined for unknown service type', () => {
      const service = client.getService(String);
      expect(service).toBeUndefined();
    });
  });

  describe('fetchPrompt', () => {
    it('should fetch a prompt successfully', async () => {
      const mockResponse = {
        content: 'Hello, this is a test prompt!',
        metadata: {
          name: 'test-prompt',
          version: '1.0.0',
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await client.fetchPrompt({ promptId: 'test-prompt' });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/prompts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
          body: JSON.stringify({ promptId: 'test-prompt' }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.fetchPrompt({ promptId: 'non-existent' })).rejects.toThrow(
        'Prompt API request failed: 404 Not Found'
      );
    });
  });

  describe('getResponse', () => {
    it('should return a response with fetched prompt content', async () => {
      const mockPromptResponse = {
        content: 'This is the fetched prompt content',
        metadata: { name: 'test-prompt' },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPromptResponse),
      });

      const messages = [
        new ChatMessage({
          role: 'user',
          contents: [new TextContent('test-prompt-id')],
        }),
      ];

      const response = await client.getResponse(messages);

      expect(response.message.role).toBe('assistant');
      expect(response.message.contents).toHaveLength(1);
      expect((response.message.contents[0] as TextContent).text).toBe(mockPromptResponse.content);
    });
  });
});
