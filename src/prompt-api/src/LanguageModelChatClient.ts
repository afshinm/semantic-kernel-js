import {
  AIContent,
  ChatClient,
  ChatClientMetadata,
  ChatFinishReason,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatResponseUpdate,
  StreamResponse,
  TextContent,
  UsageDetails,
} from '@semantic-kernel/ai';
import { LanguageModelOptions, LanguageModelRequest, LanguageModelResponse } from './LanguageModelOptions';

/**
 * A generic chat client for HTTP-based language model APIs
 */
export class LanguageModelChatClient extends ChatClient {
  private readonly _options: LanguageModelOptions;
  private readonly _metadata: ChatClientMetadata;

  constructor(options: LanguageModelOptions) {
    super();
    this._options = options;
    this._metadata = new ChatClientMetadata({
      providerName: 'language-model',
      providerUri: options.baseUrl,
      modelId: options.modelId,
    });
  }

  get metadata(): ChatClientMetadata {
    return this._metadata;
  }

  getService<T>(serviceType: T, serviceKey?: string): object | undefined {
    if (serviceKey) {
      return undefined;
    }

    if (serviceType === LanguageModelChatClient) {
      return this;
    }

    return undefined;
  }

  /**
   * Convert ChatMessage array to language model request format
   */
  private convertMessages(messages: ChatMessage[]): LanguageModelRequest['messages'] {
    return messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.contents.map((c: AIContent) => (c instanceof TextContent ? (c as TextContent).text : '')).join(' '),
    }));
  }

  /**
   * Build the request payload for the language model API
   */
  private buildRequest(messages: ChatMessage[], options?: ChatOptions): LanguageModelRequest {
    const request: LanguageModelRequest = {
      messages: this.convertMessages(messages),
      model: options?.modelId || this._options.modelId,
    };

    // Add optional parameters if provided
    if (options?.temperature !== undefined) {
      request.temperature = options.temperature;
    }
    if (options?.maxOutputTokens !== undefined) {
      request.max_tokens = options.maxOutputTokens;
    }

    return request;
  }

  /**
   * Make HTTP request to the language model API
   */
  private async makeRequest(request: LanguageModelRequest, stream: boolean = false): Promise<Response> {
    const endpoint = this._options.openAICompatible ? '/v1/chat/completions' : '/completions';
    const url = new URL(endpoint, this._options.baseUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this._options.headers,
    };

    if (this._options.apiKey) {
      headers['Authorization'] = `Bearer ${this._options.apiKey}`;
    }

    const body = JSON.stringify({
      ...request,
      stream,
    });

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body,
      signal: this._options.timeout ? AbortSignal.timeout(this._options.timeout) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Language model API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  override async getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const messages = ChatMessage.create(chatMessages);
    const request = this.buildRequest(messages, options);

    const response = await this.makeRequest(request, false);
    const data = (await response.json()) as LanguageModelResponse;

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response choices received from language model API');
    }

    const choice = data.choices[0];
    const content = choice.message.content;

    const responseMessage = new ChatMessage({
      role: 'assistant',
      contents: [new TextContent(content)],
    });

    const chatResponse = new ChatResponse({ message: responseMessage });
    chatResponse.finishReason = this.mapFinishReason(choice.finish_reason);

    if (data.usage) {
      const usage = new UsageDetails();
      usage.inputTokenCount = data.usage.prompt_tokens || 0;
      usage.outputTokenCount = data.usage.completion_tokens || 0;
      usage.totalTokenCount = data.usage.total_tokens || 0;
      chatResponse.usage = usage;
    }

    return chatResponse;
  }

  override async *getStreamingResponse(
    chatMessages: string | ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatResponseUpdate> {
    const messages = ChatMessage.create(chatMessages);
    const request = this.buildRequest(messages, options);

    const response = await this.makeRequest(request, true);

    if (!response.body) {
      throw new Error('No response body received for streaming request');
    }

    const stream = StreamResponse.fromSSEResponse(response);

    for await (const chunk of stream) {
      if (typeof chunk === 'object' && chunk !== null) {
        const data = chunk as Record<string, unknown>;

        if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
          const choice = data.choices[0] as Record<string, unknown>;
          const delta = choice.delta as Record<string, unknown>;

          if (delta && typeof delta.content === 'string') {
            const update = new ChatResponseUpdate();
            update.contents = [new TextContent(delta.content)];
            update.role = 'assistant';
            update.finishReason = this.mapFinishReason(choice.finish_reason as string);

            yield update;
          }
        }
      }
    }
  }

  /**
   * Map API finish reason to ChatFinishReason
   */
  private mapFinishReason(finishReason?: string): ChatFinishReason {
    switch (finishReason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'tool_calls':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }
}
