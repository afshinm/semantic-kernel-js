import { fromOpenAIChatCompletion, fromOpenAIStreamingChatCompletion, toOpenAIChatMessages, toOpenAIChatOptions } from './mapper/chatCompletionMapper';
import { ChatClient, ChatClientMetadata, ChatCompletion, ChatMessage, ChatOptions, StreamingChatCompletionUpdate } from '@semantic-kernel/abstractions';
import OpenAI from 'openai';


export class OpenAIChatClient extends ChatClient {
  private readonly _openAIClient: OpenAI;
  private readonly _metadata: ChatClientMetadata;

  constructor({ openAIClient, modelId }: { openAIClient: OpenAI; modelId: string }) {
    super();
    this._openAIClient = openAIClient;

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

  getService<T>(serviceType: T, serviceKey?: string) {
    if (serviceKey) {
      return undefined;
    }

    if (serviceType === OpenAI) {
      return this._openAIClient;
    }

    if (serviceType === OpenAIChatClient) {
      return this;
    }

    return undefined;
  }

  async complete(chatMessages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion> {
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

  override completeStreaming(
    chatMessages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<StreamingChatCompletionUpdate> {
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
      stream: true,
    });

    return fromOpenAIStreamingChatCompletion(chatCompletionUpdates);
  }
}
