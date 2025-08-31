import { ChatClient, ChatClientMetadata, ChatMessage, type ChatOptions } from '@semantic-kernel/ai';
import { AzureOpenAI } from 'openai';
import {
  fromOpenAIChatCompletion,
  fromOpenAIStreamingChatCompletion,
  toOpenAIChatMessages,
  toOpenAIChatOptions,
} from './mapper';

export interface AzureOpenAIConfig {
  /** Azure OpenAI API key */
  apiKey?: string;
  /** Azure OpenAI endpoint (e.g., https://your-resource.openai.azure.com) */
  endpoint: string;
  /** Azure OpenAI API version (e.g., 2024-06-01) */
  apiVersion?: string;
  /** Azure deployment name for the model */
  deploymentName: string;
  /** Optional pre-configured AzureOpenAI client */
  azureOpenAIClient?: AzureOpenAI;
}

export class AzureOpenAIChatClient extends ChatClient {
  private readonly _azureOpenAIClient: AzureOpenAI;
  private readonly _metadata: ChatClientMetadata;
  private readonly _deploymentName: string;

  constructor({ apiKey, endpoint, apiVersion, deploymentName, azureOpenAIClient }: AzureOpenAIConfig) {
    super();

    this._deploymentName = deploymentName;

    if (!azureOpenAIClient) {
      this._azureOpenAIClient = new AzureOpenAI({
        apiKey,
        endpoint,
        apiVersion: apiVersion || '2024-06-01',
      });
    } else {
      this._azureOpenAIClient = azureOpenAIClient;
    }

    const providerUri = endpoint;

    this._metadata = new ChatClientMetadata({
      providerName: 'azure-openai',
      providerUri,
      modelId: deploymentName,
    });
  }

  get metadata(): ChatClientMetadata {
    return this._metadata;
  }

  getService<T>(serviceType: T, serviceKey?: string) {
    if (serviceKey) {
      return undefined;
    }

    if (serviceType === AzureOpenAI) {
      return this._azureOpenAIClient;
    }

    if (serviceType === AzureOpenAIChatClient) {
      return this;
    }

    return undefined;
  }

  override async getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    const modelId = this._deploymentName;

    const openAIChatMessages = toOpenAIChatMessages(chatMessages);
    const openAIOptions = toOpenAIChatOptions(options);

    const params: Parameters<typeof this._azureOpenAIClient.chat.completions.create>[0] = {
      messages: openAIChatMessages,
      model: modelId,
      ...openAIOptions,
    };

    const response = await this._azureOpenAIClient.chat.completions.create({
      ...params,
      stream: false,
    });

    return fromOpenAIChatCompletion({ openAICompletion: response, options });
  }

  override getStreamingResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    const modelId = this._deploymentName;

    const openAIChatMessages = toOpenAIChatMessages(chatMessages);
    const openAIOptions = toOpenAIChatOptions(options);

    const params: Parameters<typeof this._azureOpenAIClient.chat.completions.create>[0] = {
      messages: openAIChatMessages,
      model: modelId,
      ...openAIOptions,
    };

    const chatCompletionUpdates = this._azureOpenAIClient.chat.completions.create({
      ...params,
      stream_options: { include_usage: true },
      stream: true,
    });

    return fromOpenAIStreamingChatCompletion(chatCompletionUpdates);
  }
}
