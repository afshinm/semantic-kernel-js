import { Logger, LoggerFactory } from '@semantic-kernel/common';
import { ChatClient, ChatClientMetadata, ChatOptions } from '../../chatCompletion';
import { ChatMessage } from '../../contents/ChatMessage';
import { AgentRunOptions, AgentThread } from '../abstractions';
import { AgentRunResponse } from '../abstractions/AgentRunResponse';
import { AgentRunResponseUpdate } from '../abstractions/AgentRunResponseUpdate';
import { AIAgent } from '../abstractions/AIAgent';
import { AIAgentMetadata } from '../abstractions/AIAgentMetadata';
import { ChatClientAgentOptions } from './ChatClientAgentOptions';
import { asAgentInvokedChatClient } from './ChatClientExtensions';

export class ChatClientAgent extends AIAgent {
  private _chatClient: ChatClient;
  private _agentOptions: ChatClientAgentOptions;
  private _agentMetadata?: AIAgentMetadata;
  private _logger: Logger;

  constructor(chatClient: ChatClient, options: ChatClientAgentOptions) {
    super();
    this._logger = LoggerFactory.getLogger();
    this._agentOptions = Object.assign({}, options);

    this.id = options.id ?? this.id;
    this.name = options.name;
    this.description = options.description;

    const chatClientMetadata = chatClient.getService(ChatClientMetadata) as ChatClientMetadata | undefined;
    this._agentMetadata = new AIAgentMetadata(chatClientMetadata?.providerName);

    if (options.useProvidedChatClientAsIs) {
      this._chatClient = chatClient;
    } else {
      this._chatClient = asAgentInvokedChatClient(chatClient, options);
    }
  }

  get chatClient() {
    return this._chatClient;
  }

  get chatOptions() {
    return this._agentOptions.chatOptions;
  }

  get instructions() {
    return this._agentOptions.instructions;
  }

  override getNewThread(): AgentThread {
    return new AgentThread(this._agentOptions.chatMessageStoreFactory?.());
  }

  protected override async runCore(
    messages: ChatMessage[],
    thread?: AgentThread,
    options?: AgentRunOptions
  ): Promise<AgentRunResponse> {
    const {
      thread: safeThread,
      chatOptions,
      threadMessages,
    } = await this.prepareThreadAndMessages(thread, messages, options);

    const agentName = this.getLoggingAgentName();

    this._logger.debug(`[runCore] Agent ${this.id}/${agentName} invoking client ${this._chatClient.constructor.name}`);

    const chatResponse = await this._chatClient.getResponse(threadMessages, chatOptions);

    this._logger.info(
      `[runCore] Agent ${this.id}/${agentName} invoked client ${this._chatClient.constructor.name} with message count ${messages.length}`
    );

    this.updateThreadWithTypeAndConversationId(safeThread, chatResponse.conversationId);

    await this.notifyThreadOfNewMessages(safeThread, messages);

    for (const chatResponseMessage of chatResponse.messages) {
      chatResponseMessage.authorName = agentName;
    }

    const chatResponseMessages = [...chatResponse.messages];

    await this.notifyThreadOfNewMessages(safeThread, chatResponseMessages);

    const agentRunResponse = new AgentRunResponse(chatResponseMessages);
    agentRunResponse.agentId = this.id;

    return agentRunResponse;
  }

  protected override async *runStreamingCore(
    messages: ChatMessage[],
    thread?: AgentThread,
    options?: AgentRunOptions
  ): AsyncGenerator<AgentRunResponseUpdate> {
    // Your implementation here
  }

  private async prepareThreadAndMessages(
    thread: AgentThread | undefined,
    inputMessages: ChatMessage[],
    runOptions?: AgentRunOptions
  ) {
    let chatOptions = this.createConfiguredChatOptions(runOptions);
    thread = thread ?? this.getNewThread();

    const threadMessages: ChatMessage[] = [];
    for await (const msg of thread.getMessages()) {
      threadMessages.push(msg);
    }

    threadMessages.push(...inputMessages);

    if (thread.conversationId && chatOptions?.conversationId && thread.conversationId !== chatOptions.conversationId) {
      throw new Error(
        'The provided thread has a different ConversationId than the one specified in ChatOptions. Only one id can be used for a run.'
      );
    }

    if (this.instructions) {
      if (!chatOptions) {
        chatOptions = new ChatOptions();
      }

      if (chatOptions.instructions) {
        chatOptions.instructions = `${this.instructions}\n${chatOptions.instructions}`;
      } else {
        chatOptions.instructions = this.instructions;
      }
    }

    if (thread.conversationId && chatOptions?.conversationId !== thread.conversationId) {
      if (!chatOptions) {
        chatOptions = new ChatOptions();
      }

      chatOptions.conversationId = thread.conversationId;
    }

    return { thread, chatOptions, threadMessages };
  }

  private createConfiguredChatOptions(runOptions?: AgentRunOptions) {
    let requestChatOptions: ChatOptions | undefined;

    if (runOptions instanceof ChatClientAgentOptions) {
      requestChatOptions = Object.assign({}, runOptions.chatOptions);
    }

    if (!this._agentOptions?.chatOptions) {
      return requestChatOptions;
    }

    if (!requestChatOptions) {
      return Object.assign({}, this._agentOptions.chatOptions);
    }

    requestChatOptions.allowMultipleToolCalls = this._agentOptions.chatOptions.allowMultipleToolCalls;
    requestChatOptions.conversationId = this._agentOptions.chatOptions?.conversationId;
    requestChatOptions.frequencyPenalty = this._agentOptions.chatOptions?.frequencyPenalty;
    requestChatOptions.instructions = this._agentOptions.chatOptions?.instructions;
    requestChatOptions.maxOutputTokens = this._agentOptions.chatOptions?.maxOutputTokens;
    requestChatOptions.modelId = this._agentOptions.chatOptions?.modelId;
    requestChatOptions.presencePenalty = this._agentOptions.chatOptions?.presencePenalty;
    requestChatOptions.responseFormat = this._agentOptions.chatOptions?.responseFormat;
    requestChatOptions.seed = this._agentOptions.chatOptions?.seed;
    requestChatOptions.temperature = this._agentOptions.chatOptions?.temperature;
    requestChatOptions.topP = this._agentOptions.chatOptions?.topP;
    requestChatOptions.topK = this._agentOptions.chatOptions?.topK;
    requestChatOptions.toolMode = this._agentOptions.chatOptions?.toolMode;

    if (requestChatOptions.additionalProperties && this._agentOptions.chatOptions.additionalProperties) {
      requestChatOptions.additionalProperties = Object.assign(
        {},
        this._agentOptions.chatOptions.additionalProperties,
        requestChatOptions.additionalProperties
      );
    }

    // TODO: handle rawRepresentationFactory

    if (this._agentOptions.chatOptions.stopSequences?.length) {
      requestChatOptions.stopSequences = [
        ...new Set([...(requestChatOptions.stopSequences ?? []), ...this._agentOptions.chatOptions.stopSequences]),
      ];
    }

    if (this._agentOptions.chatOptions.tools?.length) {
      requestChatOptions.tools = [...(requestChatOptions.tools ?? []), ...this._agentOptions.chatOptions.tools];
    }
  }

  private updateThreadWithTypeAndConversationId(thread: AgentThread, responseConversationId?: string) {
    if (!responseConversationId && thread.conversationId) {
      throw new Error('Service did not return a valid conversation id when using a service managed thread.');
    }

    if (responseConversationId) {
      thread.conversationId = responseConversationId;
    } else if (!thread.messageStore) {
      thread.messageStore = this._agentOptions.chatMessageStoreFactory?.();
    }
  }

  private getLoggingAgentName(): string {
    return this.name ?? 'UnnamedAgent';
  }
}
