import { ChatMessage, TextContent } from '@semantic-kernel/ai';
import { LanguageModelChatClient } from './LanguageModelChatClient';
import { LanguageModelOptions } from './LanguageModelOptions';

// Mock fetch for testing
global.fetch = jest.fn();

describe('LanguageModelChatClient', () => {
  const mockOptions: LanguageModelOptions = {
    baseUrl: 'https://api.example.com',
    modelId: 'test-model',
    apiKey: 'test-api-key',
    openAICompatible: true,
  };

  let client: LanguageModelChatClient;

  beforeEach(() => {
    client = new LanguageModelChatClient(mockOptions);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a client with correct metadata', () => {
      expect(client.metadata.providerName).toBe('language-model');
      expect(client.metadata.providerUri).toBe(mockOptions.baseUrl);
      expect(client.metadata.modelId).toBe(mockOptions.modelId);
    });
  });

  describe('getService', () => {
    it('should return itself for LanguageModelChatClient type', () => {
      const service = client.getService(LanguageModelChatClient);
      expect(service).toBe(client);
    });

    it('should return undefined for unknown service type', () => {
      const service = client.getService(String);
      expect(service).toBeUndefined();
    });
  });

  describe('getResponse', () => {
    it('should return a response from language model API', async () => {
      const mockApiResponse = {
        choices: [
          {
            message: {
              role: 'assistant' as const,
              content: 'Hello! How can I help you today?',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      });

      const messages = [
        new ChatMessage({
          role: 'user',
          contents: [new TextContent('Hello!')],
        }),
      ];

      const response = await client.getResponse(messages);

      expect(response.message.role).toBe('assistant');
      expect(response.message.contents).toHaveLength(1);
      expect((response.message.contents[0] as TextContent).text).toBe('Hello! How can I help you today?');
      expect(response.finishReason).toBe('stop');
      expect(response.usage?.inputTokenCount).toBe(10);
      expect(response.usage?.outputTokenCount).toBe(8);
      expect(response.usage?.totalTokenCount).toBe(18);
    });

    it('should throw error when no choices are returned', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ choices: [] }),
      });

      const messages = [
        new ChatMessage({
          role: 'user',
          contents: [new TextContent('Hello!')],
        }),
      ];

      await expect(client.getResponse(messages)).rejects.toThrow(
        'No response choices received from language model API'
      );
    });

    it('should throw error on failed API request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const messages = [
        new ChatMessage({
          role: 'user',
          contents: [new TextContent('Hello!')],
        }),
      ];

      await expect(client.getResponse(messages)).rejects.toThrow(
        'Language model API request failed: 500 Internal Server Error'
      );
    });
  });

  describe('request building', () => {
    it('should use OpenAI-compatible endpoint when configured', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { role: 'assistant', content: 'response' } }],
        }),
      });

      const messages = [
        new ChatMessage({
          role: 'user',
          contents: [new TextContent('test')],
        }),
      ];

      await client.getResponse(messages);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should use generic endpoint when not OpenAI-compatible', async () => {
      const nonOpenAIClient = new LanguageModelChatClient({
        ...mockOptions,
        openAICompatible: false,
      });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { role: 'assistant', content: 'response' } }],
        }),
      });

      const messages = [
        new ChatMessage({
          role: 'user',
          contents: [new TextContent('test')],
        }),
      ];

      await nonOpenAIClient.getResponse(messages);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/completions', expect.any(Object));
    });
  });
});
