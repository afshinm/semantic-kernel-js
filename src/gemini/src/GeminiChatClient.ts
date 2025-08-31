import { GenerateContentParameters, GoogleGenAI } from '@google/genai';
import { ChatClient, ChatClientMetadata, ChatMessage, type ChatOptions } from '@semantic-kernel/ai';
import {
  fromGeminiChatCompletion,
  fromGeminiStreamingChatCompletion,
  toGeminiChatOptions,
  toGeminiContent,
} from './mapper';

export class GeminiChatClient extends ChatClient {
  private readonly _googleGenAIClient: GoogleGenAI;
  private readonly _metadata: ChatClientMetadata;

  constructor({
    apiKey,
    modelId,
    googleGenAIClient,
  }: {
    apiKey?: string;
    modelId: string;
    googleGenAIClient?: GoogleGenAI;
  }) {
    super();

    if (!googleGenAIClient) {
      if (!apiKey) {
        throw new Error('API key is required when Google GenAI client is not provided');
      }
      this._googleGenAIClient = new GoogleGenAI({
        apiKey,
      });
    } else {
      this._googleGenAIClient = googleGenAIClient;
    }

    this._metadata = new ChatClientMetadata({
      providerName: 'gemini',
      providerUri: 'https://generativelanguage.googleapis.com',
      modelId,
    });
  }

  get metadata(): ChatClientMetadata {
    return this._metadata;
  }

  getService<T>(serviceType: T, serviceKey?: string) {
    if (serviceKey) {
      return undefined;
    }

    if (serviceType === GoogleGenAI) {
      return this._googleGenAIClient;
    }

    if (serviceType === GeminiChatClient) {
      return this;
    }

    return undefined;
  }

  override async getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    const modelId = this.metadata.modelId ?? options?.modelId;

    if (!modelId) {
      throw new Error('Model ID is required');
    }

    const geminiContent = toGeminiContent(chatMessages);
    const geminiOptions = toGeminiChatOptions(options);

    const request: GenerateContentParameters = {
      model: modelId,
      contents: geminiContent,
      ...geminiOptions,
    };

    const response = await this._googleGenAIClient.models.generateContent(request);

    return fromGeminiChatCompletion({ geminiResponse: response, options });
  }

  override getStreamingResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    const modelId = this.metadata.modelId ?? options?.modelId;

    if (!modelId) {
      throw new Error('Model ID is required');
    }

    const geminiContent = toGeminiContent(chatMessages);
    const geminiOptions = toGeminiChatOptions(options);

    const request: GenerateContentParameters = {
      model: modelId,
      contents: geminiContent,
      ...geminiOptions,
    };

    const streamResult = this._googleGenAIClient.models.generateContentStream(request);

    return fromGeminiStreamingChatCompletion(streamResult);
  }
}
