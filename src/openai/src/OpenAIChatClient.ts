import { ChatClient, ChatClientMetadata } from '@semantic-kernel/abstractions';
import OpenAI from 'openai';

export class OpenAIChatClient implements ChatClient {
  private readonly _openAIClient: OpenAI;
  private readonly _metadata: ChatClientMetadata;

  constructor({ openAIClient, modelId }: { openAIClient: OpenAI; modelId: string }) {
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

  complete(chatMessages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion> {
    return this._openAIClient.chat.completions.create({
      messages: [{ role: 'user', content: 'How can I list all files in a directory using Python?' }],
      model: 'gpt-4o',
    });
  }
}
