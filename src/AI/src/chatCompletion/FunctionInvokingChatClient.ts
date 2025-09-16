import { Logger, LoggerFactory } from '@semantic-kernel/common';
import { type ChatClient, ChatResponse, DelegatingChatClient, FunctionInvocationContext } from '.';
import { AITool } from '../AITool';
import { UsageDetails } from '../UsageDetails';
import {
  type AIContent,
  ChatMessage,
  FunctionApprovalRequestContent,
  FunctionApprovalResponseContent,
  FunctionCallContent,
  FunctionResultContent,
} from '../contents';
import { AIFunction, AIFunctionArguments, ApprovalRequiredAIFunction } from '../functions';
import { generateId } from '../utilities';
import { ChatOptions } from './ChatOptions';
import { toChatResponse } from './ChatResponseExtensions';
import { ChatResponseUpdate } from './ChatResponseUpdate';
import { RequiredChatToolMode } from './RequiredChatToolMode';

/**
 * Provides information about the invocation of a function call.
 */
export class FunctionInvocationResult {
  constructor({
    terminate,
    status,
    callContent,
    result,
    exception,
  }: {
    terminate: boolean;
    status: FunctionInvocationStatus;
    callContent: FunctionCallContent;
    result?: unknown;
    exception?: Error;
  }) {
    this.terminate = terminate;
    this.status = status;
    this.callContent = callContent;
    this.result = result;
    this.exception = exception;
  }

  /**
   * Gets status about how the function invocation completed.
   */
  readonly status: FunctionInvocationStatus;

  /**
   * Gets the function call content information associated with this invocation.
   */
  readonly callContent: FunctionCallContent;

  /**
   * Gets the result of the function call.
   */
  readonly result?: unknown;

  /**
   * Gets any exception the function call threw.
   */
  readonly exception?: Error;

  /**
   * Gets a value indicating whether the caller should terminate the processing loop.
   */
  readonly terminate: boolean;
}

/**
 * Provides error codes for when errors occur as part of the function calling loop.
 */
export enum FunctionInvocationStatus {
  /**
   * The operation completed successfully.
   */
  RanToCompletion,

  /**
   * The requested function could not be found.
   */
  NotFound,

  /**
   * The function call failed with an exception.
   */
  Exception,
}

interface ApprovalResultWithRequestMessage {
  response: FunctionApprovalResponseContent;
  requestMessage?: ChatMessage;
}

/**
 * A delegating chat client that invokes functions defined on ChatOptions.
 * Include this in a chat pipeline to resolve function calls automatically.
 */
export class FunctionInvokingChatClient extends DelegatingChatClient {
  private static _currentContext?: FunctionInvocationContext;
  private _logger: Logger;
  private _maximumIterationsPerRequest: number = 40;
  private _maximumConsecutiveErrorsPerRequest: number = 3;

  /**
   * Gets or sets the FunctionInvocationContext for the current function invocation.
   * This value flows across async calls.
   */
  public static get currentContext(): FunctionInvocationContext | undefined {
    return FunctionInvokingChatClient._currentContext;
  }

  protected static set currentContext(value: FunctionInvocationContext | undefined) {
    FunctionInvokingChatClient._currentContext = value;
  }

  /**
   * Gets or sets a value indicating whether detailed exception information should be included
   * in the chat history when calling the underlying ChatClient.
   */
  public includeDetailedErrors: boolean = false;

  /**
   * Gets or sets a value indicating whether to allow concurrent invocation of functions.
   */
  public allowConcurrentInvocation: boolean = false;

  /**
   * Gets or sets the maximum number of iterations per request.
   */
  public get maximumIterationsPerRequest(): number {
    return this._maximumIterationsPerRequest;
  }

  public set maximumIterationsPerRequest(value: number) {
    if (value < 1) {
      throw new Error('The maximum iterations per request must be at least 1.');
    }
    this._maximumIterationsPerRequest = value;
  }

  /**
   * Gets or sets the maximum number of consecutive iterations that are allowed to fail with an error.
   */
  public get maximumConsecutiveErrorsPerRequest(): number {
    return this._maximumConsecutiveErrorsPerRequest;
  }

  public set maximumConsecutiveErrorsPerRequest(value: number) {
    if (value < 0) {
      throw new Error('The maximum consecutive errors per request must be at least 0.');
    }
    this._maximumConsecutiveErrorsPerRequest = value;
  }

  /**
   * Gets or sets a collection of additional tools the client is able to invoke.
   */
  public additionalTools?: AITool[];

  /**
   * Gets or sets a value indicating whether a request to call an unknown function should terminate the function calling loop.
   */
  public terminateOnUnknownCalls: boolean = false;

  /**
   * Gets or sets a delegate used to invoke AIFunction instances.
   */
  public functionInvoker?: (context: FunctionInvocationContext) => Promise<unknown>;

  constructor(innerClient: ChatClient, loggerFactory?: { getLogger(): Logger }) {
    super(innerClient);
    this._logger = loggerFactory?.getLogger() ?? LoggerFactory.getLogger();
  }

  override async getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!chatMessages) {
      throw new Error('Messages cannot be null.');
    }

    // Copy the original messages to avoid enumerating multiple times
    const originalMessages = ChatMessage.create(chatMessages);
    let messages: ChatMessage[] = originalMessages;

    let augmentedHistory: ChatMessage[] | undefined;
    let response: ChatResponse | undefined;
    let responseMessages: ChatMessage[] | undefined;
    let totalUsage: UsageDetails | undefined;
    let functionCallContents: FunctionCallContent[] | undefined;
    let lastIterationHadConversationId = false;
    let consecutiveErrorCount = 0;

    const { toolMap, anyToolsRequireApproval } = this.createToolsMap(this.additionalTools, options?.tools);

    const toolMessageId = generateId();

    if (this.hasAnyApprovalContent(originalMessages)) {
      const functionCallContentFallbackMessageId = generateId();

      const { preDownstreamCallHistory, notInvokedApprovals } = this.processApprovalResponses(
        originalMessages,
        !!options?.conversationId,
        toolMessageId,
        functionCallContentFallbackMessageId
      );

      responseMessages = preDownstreamCallHistory;

      const { invokedApprovedFunctionApprovalResponses, shouldTerminate, newConsecutiveErrorCount } =
        await this.invokeApprovedFunctionApprovalResponsesAsync(
          notInvokedApprovals,
          toolMap,
          originalMessages,
          options,
          consecutiveErrorCount,
          false
        );

      consecutiveErrorCount = newConsecutiveErrorCount;

      if (invokedApprovedFunctionApprovalResponses) {
        responseMessages = responseMessages
          ? [...responseMessages, ...invokedApprovedFunctionApprovalResponses]
          : invokedApprovedFunctionApprovalResponses;
      }

      if (shouldTerminate) {
        return new ChatResponse({ choices: responseMessages || [] });
      }
    }

    // Main function calling loop
    for (let iteration = 0; ; iteration++) {
      functionCallContents = undefined;

      // Make the call to the inner client
      response = await super.getResponse(messages, options);
      if (!response) {
        throw new Error('The inner ChatClient returned a null ChatResponse.');
      }

      // Handle approval requirements
      if (anyToolsRequireApproval && toolMap) {
        const updatedMessages = this.replaceFunctionCallsWithApprovalRequests(response.messages, toolMap);
        response.messages = updatedMessages;
      }

      // Check if function invocation is required
      functionCallContents = [];
      const anyFunctionCalls = this.copyFunctionCalls(response.messages).length > 0;
      const requiresFunctionInvocation = iteration < this.maximumIterationsPerRequest && anyFunctionCalls;

      if (!requiresFunctionInvocation && iteration === 0) {
        // Fast path for no function calling
        if (responseMessages && responseMessages.length > 0) {
          responseMessages.push(...response.messages);
          response.messages = responseMessages;
        }

        return response;
      }

      // Track aggregate details
      responseMessages = responseMessages ? [...responseMessages, ...response.messages] : [...response.messages];
      if (response.usage) {
        if (totalUsage) {
          totalUsage.add(response.usage);
        } else {
          totalUsage = response.usage;
        }
      }

      // Check if we should terminate
      if (
        !requiresFunctionInvocation ||
        this.shouldTerminateLoopBasedOnHandleableFunctions(functionCallContents, toolMap)
      ) {
        break;
      }

      // Prepare history for next iteration
      ({ messages, augmentedHistory, lastIterationHadConversationId } = this.fixupHistories(
        originalMessages,
        messages,
        augmentedHistory,
        response,
        responseMessages,
        lastIterationHadConversationId
      ));
      // messages = augmentedHistory || messages;

      // Process function calls
      if (functionCallContents) {
        const modAndMessages = await this.processFunctionCallsAsync(
          messages,
          options,
          toolMap,
          functionCallContents,
          iteration,
          consecutiveErrorCount,
          false
        );

        responseMessages.push(...modAndMessages.messagesAdded);
        consecutiveErrorCount = modAndMessages.newConsecutiveErrorCount;

        if (modAndMessages.shouldTerminate) {
          break;
        }
      }

      this.updateOptionsForNextIteration(options, response.conversationId);
    }

    response.messages = responseMessages;
    response.usage = totalUsage;

    return response;
  }

  override async *getStreamingResponse(
    chatMessages: string | ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatResponseUpdate> {
    if (!chatMessages) {
      throw new Error('Messages cannot be null.');
    }

    // Copy the original messages to avoid enumerating multiple times
    const originalMessages = ChatMessage.create(chatMessages);
    let messages: ChatMessage[] = originalMessages;

    let approvalRequiredFunctions: ApprovalRequiredAIFunction[] | undefined;
    let augmentedHistory: ChatMessage[] | undefined;
    let functionCallContents: FunctionCallContent[] | undefined;
    let responseMessages: ChatMessage[] | undefined;
    let lastIterationHadConversationId = false;
    let updates: ChatResponseUpdate[] = [];
    let consecutiveErrorCount = 0;

    const { toolMap, anyToolsRequireApproval } = this.createToolsMap(this.additionalTools, options?.tools);
    const toolMessageId = generateId();

    if (this.hasAnyApprovalContent(originalMessages)) {
      const functionCallContentFallbackMessageId = generateId();

      const { preDownstreamCallHistory, notInvokedApprovals } = this.processApprovalResponses(
        originalMessages,
        !!options?.conversationId,
        toolMessageId,
        functionCallContentFallbackMessageId
      );

      if (preDownstreamCallHistory) {
        for (const message of preDownstreamCallHistory) {
          yield this.convertToolResultMessageToUpdate(message, options?.conversationId, message.messageId);
        }
      }

      if (notInvokedApprovals && notInvokedApprovals.length > 0) {
        const { invokedApprovedFunctionApprovalResponses, shouldTerminate, newConsecutiveErrorCount } =
          await this.invokeApprovedFunctionApprovalResponsesAsync(
            notInvokedApprovals,
            toolMap,
            originalMessages,
            options,
            consecutiveErrorCount,
            true
          );

        consecutiveErrorCount = newConsecutiveErrorCount;

        if (invokedApprovedFunctionApprovalResponses) {
          for (const message of invokedApprovedFunctionApprovalResponses) {
            message.messageId = toolMessageId;
            yield this.convertToolResultMessageToUpdate(message, options?.conversationId, message.messageId);
          }

          if (shouldTerminate) {
            return;
          }
        }
      }
    }

    // Main function calling loop
    for (let iteration = 0; ; iteration++) {
      updates = [];
      functionCallContents = undefined;

      let hasApprovalRequiringFcc = false;
      let lastApprovalCheckedFCCIndex = 0;
      let lastYieldedUpdateIndex = 0;

      for await (const update of super.getStreamingResponse(messages, options)) {
        if (!update) {
          throw new Error('The inner ChatClient streamed a null ChatResponseUpdate.');
        }

        updates.push(update);

        functionCallContents = this.copyFunctionCalls(update.contents);

        // TODO: update totalUsage

        if (anyToolsRequireApproval && !approvalRequiredFunctions && functionCallContents.length > 0) {
          approvalRequiredFunctions = [...(options?.tools || []), ...(this.additionalTools || [])].filter(
            (tool) => tool instanceof ApprovalRequiredAIFunction
          );
        }

        if (!approvalRequiredFunctions || approvalRequiredFunctions.length === 0) {
          lastYieldedUpdateIndex++;
          yield update;
          continue;
        }

        ({ hasApprovalRequiringFcc, lastApprovalCheckedFCCIndex } = this.checkForApprovalRequiringFCC(
          functionCallContents,
          approvalRequiredFunctions,
          hasApprovalRequiringFcc,
          lastApprovalCheckedFCCIndex
        ));

        if (hasApprovalRequiringFcc) {
          for (; lastYieldedUpdateIndex < updates.length; lastYieldedUpdateIndex++) {
            const updateToYield = updates[lastYieldedUpdateIndex];
            const updatedContents = this.tryReplaceFunctionCallsWithApprovalRequests(updateToYield.contents);
            if (updatedContents) {
              updateToYield.contents = updatedContents;
            }
            yield updateToYield;
          }
          continue;
        }
      }

      // Check termination conditions
      if (
        iteration >= this.maximumIterationsPerRequest ||
        hasApprovalRequiringFcc ||
        this.shouldTerminateLoopBasedOnHandleableFunctions(functionCallContents, toolMap)
      ) {
        break;
      }

      // Reconstitute response from updates
      const response = toChatResponse(updates);
      responseMessages = responseMessages ? [...responseMessages, ...response.messages] : [...response.messages];

      // Prepare history for next iteration
      ({ messages, augmentedHistory, lastIterationHadConversationId } = this.fixupHistories(
        originalMessages,
        messages,
        augmentedHistory,
        response,
        responseMessages,
        lastIterationHadConversationId
      ));

      // Process function calls
      if (functionCallContents) {
        const modAndMessages = await this.processFunctionCallsAsync(
          messages,
          options,
          toolMap,
          functionCallContents,
          iteration,
          consecutiveErrorCount,
          true
        );

        responseMessages.push(...modAndMessages.messagesAdded);
        consecutiveErrorCount = modAndMessages.newConsecutiveErrorCount;

        // Stream generated function results
        for (const message of modAndMessages.messagesAdded) {
          yield this.convertToolResultMessageToUpdate(message, response.conversationId, toolMessageId);
        }

        if (modAndMessages.shouldTerminate) {
          break;
        }
      }

      this.updateOptionsForNextIteration(options, response.conversationId);
    }
  }

  private createToolsMap(...toolLists: (AITool[] | undefined)[]): {
    toolMap?: Map<string, AITool>;
    anyToolsRequireApproval: boolean;
  } {
    const toolMap: Map<string, AITool> = new Map();
    let anyToolsRequireApproval = false;

    for (const toolList of toolLists) {
      if (toolList && toolList.length > 0) {
        for (const tool of toolList) {
          anyToolsRequireApproval = anyToolsRequireApproval || tool instanceof ApprovalRequiredAIFunction;
          toolMap.set(tool.name, tool);
        }
      }
    }

    return { toolMap, anyToolsRequireApproval };
  }

  private hasAnyApprovalContent(messages: ChatMessage[]): boolean {
    return messages.some((m) =>
      m.contents.some(
        (c) => c instanceof FunctionApprovalRequestContent || c instanceof FunctionApprovalResponseContent
      )
    );
  }

  private copyFunctionCalls(contentsOrMessages: (AIContent | ChatMessage)[]): FunctionCallContent[] {
    const functionCalls: FunctionCallContent[] = [];
    const contents: AIContent[] = [];

    for (const item of contentsOrMessages) {
      if (item instanceof ChatMessage) {
        contents.push(...item.contents);
      } else {
        contents.push(item);
      }
    }

    for (const item of contents) {
      if (item instanceof FunctionCallContent) {
        functionCalls.push(item);
      }
    }

    return functionCalls;
  }

  private shouldTerminateLoopBasedOnHandleableFunctions(
    functionCalls?: FunctionCallContent[],
    toolMap?: Map<string, AITool>
  ): boolean {
    if (!functionCalls || functionCalls.length === 0) {
      return true;
    }

    if (!toolMap || toolMap.size === 0) {
      return this.terminateOnUnknownCalls;
    }

    for (const fcc of functionCalls) {
      const tool = toolMap.get(fcc.name);
      if (tool) {
        if (!(tool instanceof AIFunction)) {
          return true;
        }
      } else {
        if (this.terminateOnUnknownCalls) {
          return true;
        }
      }
    }

    return false;
  }

  private async processFunctionCallsAsync(
    messages: ChatMessage[],
    options: ChatOptions | undefined,
    toolMap: Map<string, AITool> | undefined,
    functionCallContents: FunctionCallContent[],
    iteration: number,
    consecutiveErrorCount: number,
    isStreaming: boolean
  ): Promise<{ shouldTerminate: boolean; newConsecutiveErrorCount: number; messagesAdded: ChatMessage[] }> {
    const functionCount = functionCallContents.length;
    const captureCurrentIterationExceptions = consecutiveErrorCount < this.maximumConsecutiveErrorsPerRequest;

    if (functionCount === 1) {
      const result = await this.processFunctionCallAsync(
        messages,
        options,
        toolMap,
        functionCallContents,
        iteration,
        0,
        captureCurrentIterationExceptions,
        isStreaming
      );

      const addedMessages = this.createResponseMessages([result]);
      this.throwIfNoFunctionResultsAdded(addedMessages);
      this.updateConsecutiveErrorCountOrThrow(addedMessages, consecutiveErrorCount);
      messages.push(...addedMessages);

      return {
        shouldTerminate: result.terminate,
        newConsecutiveErrorCount: consecutiveErrorCount,
        messagesAdded: addedMessages,
      };
    } else {
      const results: FunctionInvocationResult[] = [];

      if (this.allowConcurrentInvocation) {
        const promises = functionCallContents.map((_, callIndex) =>
          this.processFunctionCallAsync(
            messages,
            options,
            toolMap,
            functionCallContents,
            iteration,
            callIndex,
            true,
            isStreaming
          )
        );
        results.push(...(await Promise.all(promises)));
      } else {
        for (let callIndex = 0; callIndex < functionCount; callIndex++) {
          const functionResult = await this.processFunctionCallAsync(
            messages,
            options,
            toolMap,
            functionCallContents,
            iteration,
            callIndex,
            captureCurrentIterationExceptions,
            isStreaming
          );

          results.push(functionResult);

          if (functionResult.terminate) {
            break;
          }
        }
      }

      const addedMessages = this.createResponseMessages(results);
      this.throwIfNoFunctionResultsAdded(addedMessages);
      this.updateConsecutiveErrorCountOrThrow(addedMessages, consecutiveErrorCount);
      messages.push(...addedMessages);

      const shouldTerminate = results.some((r) => r.terminate);

      return {
        shouldTerminate,
        newConsecutiveErrorCount: consecutiveErrorCount,
        messagesAdded: addedMessages,
      };
    }
  }

  private async processFunctionCallAsync(
    messages: ChatMessage[],
    options: ChatOptions | undefined,
    toolMap: Map<string, AITool> | undefined,
    callContents: FunctionCallContent[],
    iteration: number,
    functionCallIndex: number,
    captureExceptions: boolean,
    isStreaming: boolean
  ): Promise<FunctionInvocationResult> {
    const callContent = callContents[functionCallIndex];

    // Look up the AIFunction for the function call
    if (!toolMap || !toolMap.has(callContent.name)) {
      return new FunctionInvocationResult({
        terminate: false,
        status: FunctionInvocationStatus.NotFound,
        callContent,
      });
    }

    const tool = toolMap.get(callContent.name);
    if (!tool || !(tool instanceof AIFunction)) {
      return new FunctionInvocationResult({
        terminate: false,
        status: FunctionInvocationStatus.NotFound,
        callContent,
      });
    }

    const context = new FunctionInvocationContext({
      chatMessages: messages,
      args: new AIFunctionArguments(callContent.arguments),
      functionCallContent: callContent,
      func: tool,
      options,
    });

    context.iteration = iteration;
    context.functionCallIndex = functionCallIndex;
    context.functionCount = callContents.length;
    context.isStreaming = isStreaming;

    try {
      const result = await this.instrumentedInvokeFunctionAsync(context);
      return new FunctionInvocationResult({
        terminate: context.terminate || false,
        status: FunctionInvocationStatus.RanToCompletion,
        callContent,
        result,
      });
    } catch (e) {
      if (!captureExceptions) {
        throw e;
      }

      return new FunctionInvocationResult({
        terminate: false,
        status: FunctionInvocationStatus.Exception,
        callContent,
        exception: e instanceof Error ? e : new Error(String(e)),
      });
    }
  }

  private async instrumentedInvokeFunctionAsync(context: FunctionInvocationContext): Promise<unknown> {
    if (!context) {
      throw new Error('Context cannot be null.');
    }

    const startTime = performance.now();

    this._logger.debug(`Invoking ${context.function.name}.`);
    this._logger.trace(`Invoking ${context.function.name}.`, { arguments: context.arguments });

    let result: unknown;
    try {
      FunctionInvokingChatClient.currentContext = context;
      result = await this.invokeFunctionAsync(context);
    } catch (e) {
      this._logger.error(`${context.function.name} invocation failed`, { error: e });
      throw e;
    } finally {
      const duration = performance.now() - startTime;
      this._logger.debug(`${context.function.name} invocation completed.`);
      this._logger.trace(`${context.function.name} invocation completed.`, { result, duration });
    }

    return result;
  }

  protected async invokeFunctionAsync(context: FunctionInvocationContext): Promise<unknown> {
    if (!context) {
      throw new Error('Context cannot be null.');
    }

    return this.functionInvoker ? this.functionInvoker(context) : context.function.invoke(context.arguments);
  }

  protected createResponseMessages(results: FunctionInvocationResult[]): ChatMessage[] {
    const contents = results.map((result) => this.createFunctionResultContent(result));
    return [new ChatMessage({ role: 'tool', contents })];
  }

  private createFunctionResultContent(result: FunctionInvocationResult): FunctionResultContent {
    if (!result) {
      throw new Error('Result cannot be null.');
    }

    let functionResult: unknown;
    if (result.status === FunctionInvocationStatus.RanToCompletion) {
      functionResult = result.result ?? 'Success: Function completed.';
    } else {
      let message =
        result.status === FunctionInvocationStatus.NotFound
          ? `Error: Requested function "${result.callContent.name}" not found.`
          : result.status === FunctionInvocationStatus.Exception
            ? 'Error: Function failed.'
            : 'Error: Unknown error.';

      if (this.includeDetailedErrors && result.exception) {
        message = `${message} Exception: ${result.exception.message}`;
      }

      functionResult = message;
    }

    const functionResultContent = new FunctionResultContent({
      callId: result.callContent.callId,
      name: result.callContent.name,
      result: functionResult,
    });

    if (result.exception) {
      (functionResultContent as FunctionResultContent & { exception: Error }).exception = result.exception;
    }

    return functionResultContent;
  }

  private updateConsecutiveErrorCountOrThrow(added: ChatMessage[], consecutiveErrorCount: number): void {
    const hasErrors = added.some((m) =>
      m.contents.some(
        (c) => c instanceof FunctionResultContent && (c as FunctionResultContent & { exception?: Error }).exception
      )
    );

    if (hasErrors) {
      consecutiveErrorCount++;
      if (consecutiveErrorCount > this.maximumConsecutiveErrorsPerRequest) {
        const allExceptions = added
          .flatMap((m) => m.contents)
          .filter((c): c is FunctionResultContent => c instanceof FunctionResultContent)
          .map((frc) => (frc as FunctionResultContent & { exception?: Error }).exception)
          .filter((e): e is Error => e !== undefined);

        if (allExceptions.length === 1) {
          throw allExceptions[0];
        }

        const error = new Error('Multiple function invocation errors occurred.');
        (error as Error & { errors: Error[] }).errors = allExceptions;
        throw error;
      }
    } else {
      consecutiveErrorCount = 0;
    }
  }

  private throwIfNoFunctionResultsAdded(messages?: ChatMessage[]): void {
    if (!messages || messages.length === 0) {
      throw new Error('CreateResponseMessages returned null or an empty collection of messages.');
    }
  }

  private fixupHistories(
    originalMessages: ChatMessage[],
    messages: ChatMessage[],
    augmentedHistory: ChatMessage[] | undefined,
    response: ChatResponse,
    allTurnsResponseMessages: ChatMessage[],
    lastIterationHadConversationId: boolean
  ): {
    messages: ChatMessage[];
    augmentedHistory: ChatMessage[] | undefined;
    lastIterationHadConversationId: boolean;
  } {
    const payload = {
      messages,
      augmentedHistory,
      lastIterationHadConversationId,
    };

    if (response.conversationId) {
      if (payload.augmentedHistory) {
        payload.augmentedHistory.splice(0, payload.augmentedHistory.length);
      } else {
        payload.augmentedHistory = [];
      }

      payload.lastIterationHadConversationId = true;
    } else if (lastIterationHadConversationId) {
      if (!payload.augmentedHistory) {
        payload.augmentedHistory = [];
      }
      payload.augmentedHistory = [...originalMessages, ...allTurnsResponseMessages];
      payload.lastIterationHadConversationId = false;
    } else {
      if (!payload.augmentedHistory) {
        payload.augmentedHistory = originalMessages;
      }
      payload.augmentedHistory.push(...response.messages);
      payload.lastIterationHadConversationId = false;
    }

    payload.messages = payload.augmentedHistory;

    return payload;
  }

  private updateOptionsForNextIteration(options: ChatOptions | undefined, conversationId?: string): void {
    if (!options) {
      if (conversationId) {
        options = new ChatOptions();
        options.conversationId = conversationId;
      }
    } else if (options.toolMode instanceof RequiredChatToolMode) {
      options = options.clone();
      options.toolMode = 'auto';
      options.conversationId = conversationId;
    } else if (options.conversationId !== conversationId) {
      options = options.clone();
      options.conversationId = conversationId;
    }
  }

  private extractAndRemoveApprovalRequestsAndResponses(messages: (ChatMessage | undefined)[]): {
    approvals?: ApprovalResultWithRequestMessage[];
    rejections?: ApprovalResultWithRequestMessage[];
  } {
    const allApprovalRequestsMessages = new Map<string, ChatMessage>();
    const allApprovalResponses: FunctionApprovalResponseContent[] = [];
    const approvalRequestCallIds = new Set<string>();
    const functionResultCallIds = new Set<string>();

    // First pass: collect approval requests and responses, track function results
    let anyRemoved = false;
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (!message) {
        continue;
      }

      const keptContents: AIContent[] = [];

      for (const content of message?.contents || []) {
        if (content instanceof FunctionApprovalRequestContent) {
          approvalRequestCallIds.add(content.functionCallContent.callId);
          allApprovalRequestsMessages.set(content.id, message);
        } else if (content instanceof FunctionApprovalResponseContent) {
          approvalRequestCallIds.delete(content.functionCall.callId);
          allApprovalResponses.push(content);
        } else if (content instanceof FunctionResultContent) {
          functionResultCallIds.add(content.callId);
          keptContents.push(content);
        } else {
          keptContents.push(content);
        }
      }

      // Update message if contents were filtered
      if (keptContents.length !== message?.contents.length) {
        if (keptContents.length > 0) {
          const newMessage = Object.assign(new ChatMessage({ role: message.role, contents: keptContents }), message);
          messages[i] = newMessage;
        } else {
          messages[i] = undefined;
          anyRemoved = true;
        }
      }
    }

    // Remove null messages
    if (anyRemoved) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i] === null) {
          messages.splice(i, 1);
        }
      }
    }

    // Validate that we have responses for all requests
    if (approvalRequestCallIds.size > 0) {
      throw new Error(
        `FunctionApprovalRequestContent found with FunctionCall.CallId(s) '${Array.from(approvalRequestCallIds).join(', ')}' that have no matching FunctionApprovalResponseContent.`
      );
    }

    // Second pass: categorize responses into approved and rejected
    const approvedFunctionCalls: ApprovalResultWithRequestMessage[] = [];
    const rejectedFunctionCalls: ApprovalResultWithRequestMessage[] = [];

    for (const approvalResponse of allApprovalResponses) {
      // Skip if already processed
      if (functionResultCallIds.has(approvalResponse.functionCall.callId)) {
        continue;
      }

      const requestMessage = allApprovalRequestsMessages.get(approvalResponse.functionCall.callId);
      const resultWithRequestMessage: ApprovalResultWithRequestMessage = {
        response: approvalResponse,
        requestMessage,
      };

      if (approvalResponse.approved) {
        approvedFunctionCalls.push(resultWithRequestMessage);
      } else {
        rejectedFunctionCalls.push(resultWithRequestMessage);
      }
    }

    return {
      approvals: approvedFunctionCalls.length > 0 ? approvedFunctionCalls : undefined,
      rejections: rejectedFunctionCalls.length > 0 ? rejectedFunctionCalls : undefined,
    };
  }

  private generateRejectedFunctionResults(rejections?: ApprovalResultWithRequestMessage[]): AIContent[] | undefined {
    if (!rejections || rejections.length === 0) {
      return undefined;
    }

    return rejections.map(
      (rejection) =>
        new FunctionResultContent({
          callId: rejection.response.functionCall.callId,
          name: rejection.response.functionCall.name,
          result: 'Error: Tool call invocation was rejected by user.',
        })
    );
  }

  private convertToFunctionCallContentMessages(
    resultWithRequestMessages: ApprovalResultWithRequestMessage[],
    fallbackMessageId: string
  ): ChatMessage[] | undefined {
    if (!resultWithRequestMessages || resultWithRequestMessages.length === 0) {
      return undefined;
    }

    const messagesById = new Map<string, ChatMessage>();

    for (const resultWithRequestMessage of resultWithRequestMessages) {
      const messageId = resultWithRequestMessage.requestMessage?.messageId || fallbackMessageId;

      let message = messagesById.get(messageId);
      if (!message) {
        message = resultWithRequestMessage.requestMessage
          ? this.cloneChatMessage(resultWithRequestMessage.requestMessage)
          : new ChatMessage({ role: 'assistant' });
        message.contents = [resultWithRequestMessage.response.functionCall];
        message.messageId = messageId;
        messagesById.set(messageId, message);
      } else {
        message.contents.push(resultWithRequestMessage.response.functionCall);
      }
    }

    return Array.from(messagesById.values());
  }

  private cloneChatMessage(message: ChatMessage): ChatMessage {
    const cloned = new ChatMessage({ role: message.role, contents: [...message.contents] });
    cloned.messageId = message.messageId;
    cloned.authorName = message.authorName;
    cloned.createdAt = message.createdAt;
    cloned.additionalProperties = message.additionalProperties;
    cloned.rawRepresentation = message.rawRepresentation;
    return cloned;
  }

  private processApprovalResponses(
    originalMessages: ChatMessage[],
    hasConversationId: boolean,
    toolMessageId: string,
    functionCallContentFallbackMessageId: string
  ): { preDownstreamCallHistory?: ChatMessage[]; notInvokedApprovals?: ApprovalResultWithRequestMessage[] } {
    const { approvals, rejections } = this.extractAndRemoveApprovalRequestsAndResponses(originalMessages);

    // Convert to function call content messages
    const allPreDownstreamCallMessages = this.convertToFunctionCallContentMessages(
      [...(rejections || []), ...(approvals || [])],
      functionCallContentFallbackMessageId
    );

    // Generate failed function result contents for any rejected requests
    const rejectedFunctionCallResults = this.generateRejectedFunctionResults(rejections);
    let rejectedPreDownstreamCallResultsMessage: ChatMessage | undefined;
    if (rejectedFunctionCallResults) {
      rejectedPreDownstreamCallResultsMessage = new ChatMessage({
        role: 'tool',
        contents: rejectedFunctionCallResults,
      });
      rejectedPreDownstreamCallResultsMessage.messageId = toolMessageId;
    }

    // Add all the FCC that we generated to the pre-downstream-call history
    let preDownstreamCallHistory: ChatMessage[] | undefined;
    if (allPreDownstreamCallMessages && allPreDownstreamCallMessages.length > 0) {
      preDownstreamCallHistory = [...allPreDownstreamCallMessages];
      if (!hasConversationId) {
        originalMessages.push(...preDownstreamCallHistory);
      }
    }

    // Add all the FRC that we generated to the pre-downstream-call history
    if (rejectedPreDownstreamCallResultsMessage) {
      preDownstreamCallHistory = preDownstreamCallHistory || [];
      preDownstreamCallHistory.push(rejectedPreDownstreamCallResultsMessage);
      originalMessages.push(rejectedPreDownstreamCallResultsMessage);
    }

    return { preDownstreamCallHistory, notInvokedApprovals: approvals };
  }

  private async invokeApprovedFunctionApprovalResponsesAsync(
    notInvokedApprovals: ApprovalResultWithRequestMessage[] | undefined,
    toolMap: Map<string, AITool> | undefined,
    originalMessages: ChatMessage[],
    options: ChatOptions | undefined,
    consecutiveErrorCount: number,
    isStreaming: boolean
  ): Promise<{
    invokedApprovedFunctionApprovalResponses?: ChatMessage[];
    shouldTerminate: boolean;
    newConsecutiveErrorCount: number;
  }> {
    if (!notInvokedApprovals || notInvokedApprovals.length === 0) {
      return {
        invokedApprovedFunctionApprovalResponses: undefined,
        shouldTerminate: false,
        newConsecutiveErrorCount: consecutiveErrorCount,
      };
    }

    // Extract function call contents from approved responses
    const functionCallContents = notInvokedApprovals.map((approval) => approval.response.functionCall);

    // Process the function calls
    const { shouldTerminate, newConsecutiveErrorCount, messagesAdded } = await this.processFunctionCallsAsync(
      originalMessages,
      options,
      toolMap,
      functionCallContents,
      0,
      consecutiveErrorCount,
      isStreaming
    );

    return {
      invokedApprovedFunctionApprovalResponses: messagesAdded,
      shouldTerminate,
      newConsecutiveErrorCount,
    };
  }

  private replaceFunctionCallsWithApprovalRequests(
    messages: ChatMessage[],
    toolMap: Map<string, AITool>
  ): ChatMessage[] {
    const outputMessages = [...messages];
    let anyApprovalRequired = false;
    const allFunctionCallContentIndices: Array<{ messageIndex: number; contentIndex: number }> = [];

    // Build a list of the indices of all FunctionCallContent items
    // Also check if any of them require approval
    for (let i = 0; i < messages.length; i++) {
      const content = messages[i].contents;
      for (let j = 0; j < content.length; j++) {
        if (content[j] instanceof FunctionCallContent) {
          const functionCall = content[j] as FunctionCallContent;
          allFunctionCallContentIndices.push({ messageIndex: i, contentIndex: j });

          if (!anyApprovalRequired) {
            const tool = toolMap.get(functionCall.name);
            if (tool instanceof ApprovalRequiredAIFunction) {
              anyApprovalRequired = true;
            }
          }
        }
      }
    }

    // If any function calls were found, and any of them required approval, replace all of them with approval requests
    if (anyApprovalRequired && allFunctionCallContentIndices.length > 0) {
      let lastMessageIndex = -1;

      for (const { messageIndex, contentIndex } of allFunctionCallContentIndices) {
        // Clone the message if we didn't already clone it in a previous iteration
        if (lastMessageIndex !== messageIndex) {
          outputMessages[messageIndex] = this.cloneChatMessage(outputMessages[messageIndex]);
          lastMessageIndex = messageIndex;
        }

        const message = outputMessages[messageIndex];
        const functionCall = message.contents[contentIndex] as FunctionCallContent;
        message.contents[contentIndex] = new FunctionApprovalRequestContent(functionCall.callId, functionCall);
      }
    }

    return outputMessages;
  }

  private checkForApprovalRequiringFCC(
    functionCallContents: FunctionCallContent[],
    approvalRequiredFunctions: ApprovalRequiredAIFunction[],
    hasApprovalRequiringFcc: boolean,
    lastApprovalCheckedFCCIndex: number
  ): { hasApprovalRequiringFcc: boolean; lastApprovalCheckedFCCIndex: number } {
    if (hasApprovalRequiringFcc) {
      return { hasApprovalRequiringFcc: true, lastApprovalCheckedFCCIndex: functionCallContents.length };
    }

    for (; lastApprovalCheckedFCCIndex < functionCallContents.length; lastApprovalCheckedFCCIndex++) {
      const fcc = functionCallContents[lastApprovalCheckedFCCIndex];
      for (const arf of approvalRequiredFunctions) {
        if (arf.name === fcc.name) {
          hasApprovalRequiringFcc = true;
          break;
        }
      }
    }

    return { hasApprovalRequiringFcc, lastApprovalCheckedFCCIndex };
  }

  private tryReplaceFunctionCallsWithApprovalRequests(content: AIContent[]): AIContent[] | undefined {
    let updatedContent: AIContent[] | undefined;

    for (let i = 0; i < content.length; i++) {
      if (content[i] instanceof FunctionCallContent) {
        const fcc = content[i] as FunctionCallContent;
        updatedContent = updatedContent || [...content];
        updatedContent[i] = new FunctionApprovalRequestContent(fcc.callId, fcc);
      }
    }

    return updatedContent;
  }

  private convertToolResultMessageToUpdate(
    message: ChatMessage,
    conversationId?: string,
    messageId?: string
  ): ChatResponseUpdate {
    const update = new ChatResponseUpdate();
    update.additionalProperties = message.additionalProperties;
    update.authorName = message.authorName;
    update.conversationId = conversationId;
    update.createdAt = Date.now();
    update.contents = message.contents;
    update.rawRepresentation = message.rawRepresentation;
    update.responseId = messageId;
    update.messageId = messageId;
    update.role = message.role;
    return update;
  }
}

export const functionInvocation = (chatClient: ChatClient) => new FunctionInvokingChatClient(chatClient);
