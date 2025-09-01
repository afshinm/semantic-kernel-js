import { ChatMessage, ChatOptions } from '@semantic-kernel/ai';
import { GeminiChatClient } from './GeminiChatClient';

const mockGenerateContent = jest.fn();
const mockGenerateContentStream = jest.fn();

jest.mock('@google/genai', () => {
  const mockModel = {
    generateContent: () => mockGenerateContent(),
    generateContentStream: () => mockGenerateContentStream(),
  };

  const mockGenAI = jest.fn().mockImplementation(() => ({
    models: mockModel,
  }));

  return {
    GoogleGenAI: mockGenAI,
  };
});

describe('GeminiChatClient', () => {
  let client: GeminiChatClient;

  beforeEach(() => {
    client = new GeminiChatClient({
      apiKey: 'test-api-key',
      modelId: 'gemini-1.5-flash',
    });
  });

  describe('constructor', () => {
    it('should create a client with API key and model ID', () => {
      expect(client).toBeInstanceOf(GeminiChatClient);
      expect(client.metadata.modelId).toBe('gemini-1.5-flash');
      expect(client.metadata.providerName).toBe('gemini');
    });

    it('should throw error when no API key and no generative model provided', () => {
      expect(() => {
        new GeminiChatClient({
          modelId: 'gemini-1.5-flash',
        });
      }).toThrow('API key is required when Google GenAI client is not provided');
    });
  });

  describe('getResponse', () => {
    it('should handle simple text response', async () => {
      // Mock the actual implementation manually
      mockGenerateContent.mockReturnValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'Hello, how can I help you?' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 8,
          totalTokenCount: 18,
        },
      });

      const messages = [new ChatMessage({ content: 'Hello', role: 'user' })];
      const response = await client.getResponse(messages);

      expect(response.message.text).toBe('Hello, how can I help you?');
      expect(response.message.role).toBe('assistant');
      expect(response.usage?.totalTokenCount).toBe(18);
    });

    it('should throw error when model ID is missing', async () => {
      const clientWithoutModel = new GeminiChatClient({
        apiKey: 'test-api-key',
        modelId: '',
      });

      const messages = [new ChatMessage({ content: 'Hello', role: 'user' })];
      const options = new ChatOptions();

      await expect(clientWithoutModel.getResponse(messages, options)).rejects.toThrow('Model ID is required');
    });
  });

  describe('getStreamingResponse', () => {
    it('should handle streaming text response', async () => {
      // Mock the actual implementation manually
      async function* mockStream() {
        yield {
          candidates: [
            {
              content: {
                parts: [{ text: 'Hello' }],
              },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15,
          },
        };
        yield {
          candidates: [
            {
              content: {
                parts: [{ text: ', how can I help you?' }],
              },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 10,
            totalTokenCount: 20,
          },
        };
      }

      mockGenerateContentStream.mockReturnValue(mockStream());

      const messages = [new ChatMessage({ content: 'Hello', role: 'user' })];
      const stream = client.getStreamingResponse(messages);

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text;
      }

      expect(fullResponse).toBe('Hello, how can I help you?');
    });
  });

  describe('metadata', () => {
    it('should return correct metadata', () => {
      const metadata = client.metadata;
      expect(metadata.modelId).toBe('gemini-1.5-flash');
      expect(metadata.providerName).toBe('gemini');
      expect(metadata.providerUri).toBe('https://generativelanguage.googleapis.com');
    });
  });

  describe('getService', () => {
    it('should return undefined for unknown service types', () => {
      const service = client.getService(String);
      expect(service).toBeUndefined();
    });

    it('should return undefined when service key is provided', () => {
      const service = client.getService(GeminiChatClient, 'some-key');
      expect(service).toBeUndefined();
    });
  });
});
