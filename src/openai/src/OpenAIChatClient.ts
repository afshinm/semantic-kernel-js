import { ChatClient, ChatClientMetadata, ChatMessage, Constructor, type ChatOptions } from '@semantic-kernel/ai';
import OpenAI from 'openai';
import {
  fromOpenAIChatCompletion,
  fromOpenAIStreamingChatCompletion,
  toOpenAIChatMessages,
  toOpenAIChatOptions,
} from './mapper';

export class OpenAIChatClient extends ChatClient {
  private readonly _openAIClient: OpenAI;
  private readonly _metadata: ChatClientMetadata;

  constructor({ apiKey, openAIClient, modelId }: { apiKey?: string; openAIClient?: OpenAI; modelId: string }) {
    super();

    if (!openAIClient) {
      this._openAIClient = new OpenAI({ apiKey });
    } else {
      this._openAIClient = openAIClient;
    }

    const providerUri = this._openAIClient.baseURL;

    this._metadata = new ChatClientMetadata({
      providerName: 'openai',
      providerUri,
      modelId,
    });
  }

  get metadata(): ChatClientMetadata {
    return this._metadata;
  }

  getService<T extends Constructor>(serviceType: T, serviceKey?: string) {
    if (serviceKey) {
      return undefined;
    }

    if (serviceType === (OpenAI as unknown as T)) {
      return this._openAIClient as InstanceType<T>;
    }

    if (serviceType === (OpenAIChatClient as unknown as T)) {
      return this as InstanceType<T>;
    }

    return undefined;
  }

  override async getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    const modelId = this.metadata.modelId ?? options?.modelId;

    if (!modelId) {
      throw new Error('Model ID is required');
    }

    const openAIChatMessages = toOpenAIChatMessages(chatMessages);
    const openAIOptions = toOpenAIChatOptions(options);

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: openAIChatMessages,
      model: modelId,
      ...openAIOptions,
    };

    const response = await this._openAIClient.chat.completions.create({
      ...params,
      stream: false,
    });

    return fromOpenAIChatCompletion({ openAICompletion: response, options });
  }

  override getStreamingResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    const modelId = this.metadata.modelId ?? options?.modelId;

    if (!modelId) {
      throw new Error('Model ID is required');
    }

    const openAIChatMessages = toOpenAIChatMessages(chatMessages);
    const openAIOptions = toOpenAIChatOptions(options);

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: openAIChatMessages,
      model: modelId,
      ...openAIOptions,
    };

    const chatCompletionUpdates = this._openAIClient.chat.completions.create({
      ...params,
      stream_options: { include_usage: true },
      stream: true,
    });

    return fromOpenAIStreamingChatCompletion(chatCompletionUpdates);
  }
}
