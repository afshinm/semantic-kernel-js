import {
  AIContent,
  ChatClient,
  ChatClientMetadata,
  ChatMessage,
  ChatResponse,
  ChatResponseUpdate,
  TextContent,
  UsageDetails,
} from '@semantic-kernel/ai';
import { PromptApiOptions, PromptApiRequest, PromptApiResponse } from './PromptApiOptions';

/**
 * A chat client that integrates with a Prompt API service to fetch prompts
 * and manage prompt templates
 */
export class PromptApiChatClient extends ChatClient {
  private readonly _options: PromptApiOptions;
  private readonly _metadata: ChatClientMetadata;

  constructor(options: PromptApiOptions) {
    super();
    this._options = options;
    this._metadata = new ChatClientMetadata({
      providerName: 'prompt-api',
      providerUri: options.baseUrl,
      modelId: 'prompt-api-client',
    });
  }

  get metadata(): ChatClientMetadata {
    return this._metadata;
  }

  getService<T>(serviceType: T, serviceKey?: string): object | undefined {
    if (serviceKey) {
      return undefined;
    }

    if (serviceType === PromptApiChatClient) {
      return this;
    }

    return undefined;
  }

  /**
   * Fetch a prompt from the prompt API service
   */
  async fetchPrompt(request: PromptApiRequest): Promise<PromptApiResponse> {
    const url = new URL('/prompts', this._options.baseUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this._options.headers,
    };

    if (this._options.apiKey) {
      headers['Authorization'] = `Bearer ${this._options.apiKey}`;
    }

    const body = JSON.stringify(request);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body,
      signal: this._options.timeout ? AbortSignal.timeout(this._options.timeout) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Prompt API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<PromptApiResponse>;
  }

  override async getResponse(chatMessages: string | ChatMessage[]): Promise<ChatResponse> {
    // For prompt API, we return the fetched prompt as a response
    // This is a simplified implementation - in a real scenario, you might combine
    // prompt fetching with actual language model inference

    const messages = ChatMessage.create(chatMessages);
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.contents) {
      throw new Error('No message content provided');
    }

    // Extract prompt ID from the last message content
    const content = lastMessage.contents.find((c: AIContent) => c instanceof TextContent);
    if (!content) {
      throw new Error('No text content found in message');
    }

    const promptId = (content as TextContent).text;

    try {
      const promptResponse = await this.fetchPrompt({ promptId });

      const responseMessage = new ChatMessage({
        role: 'assistant',
        contents: [new TextContent(promptResponse.content)],
      });

      const response = new ChatResponse({ message: responseMessage });
      response.finishReason = 'stop';
      const usage = new UsageDetails();
      usage.inputTokenCount = 0;
      usage.outputTokenCount = promptResponse.content.length;
      usage.totalTokenCount = promptResponse.content.length;
      response.usage = usage;

      return response;
    } catch (error) {
      throw new Error(`Failed to fetch prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  override async *getStreamingResponse(chatMessages: string | ChatMessage[]): AsyncGenerator<ChatResponseUpdate> {
    // For simplicity, we'll just yield the full response as a single update
    // In a real implementation, you might stream the prompt content
    const response = await this.getResponse(chatMessages);

    const update = new ChatResponseUpdate();
    update.contents = response.message.contents;
    update.role = response.message.role;
    update.finishReason = response.finishReason;

    yield update;
  }
}
