import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ChatClient, ChatClientMetadata, ChatMessage, type ChatOptions } from '@semantic-kernel/ai';
import {
  fromGeminiChatCompletion,
  fromGeminiStreamingChatCompletion,
  toGeminiChatOptions,
  toGeminiContent,
} from './mapper';

export class GeminiChatClient extends ChatClient {
  private readonly _geminiModel: GenerativeModel;
  private readonly _metadata: ChatClientMetadata;

  constructor({
    apiKey,
    modelId,
    generativeModel,
  }: {
    apiKey?: string;
    modelId: string;
    generativeModel?: GenerativeModel;
  }) {
    super();

    if (!generativeModel) {
      if (!apiKey) {
        throw new Error('API key is required when generative model is not provided');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      this._geminiModel = genAI.getGenerativeModel({ model: modelId });
    } else {
      this._geminiModel = generativeModel;
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

    if (serviceType === GenerativeModel) {
      return this._geminiModel;
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

    const request = {
      contents: geminiContent,
      ...geminiOptions,
    };

    const response = await this._geminiModel.generateContent(request);

    return fromGeminiChatCompletion({ geminiResponse: response.response, options });
  }

  override getStreamingResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    const modelId = this.metadata.modelId ?? options?.modelId;

    if (!modelId) {
      throw new Error('Model ID is required');
    }

    const geminiContent = toGeminiContent(chatMessages);
    const geminiOptions = toGeminiChatOptions(options);

    const request = {
      contents: geminiContent,
      ...geminiOptions,
    };

    const streamResult = this._geminiModel.generateContentStream(request);

    return fromGeminiStreamingChatCompletion(streamResult);
  }
}
