import { Logger, LoggerFactory } from '@semantic-kernel/common';
import { type ChatClient, type ChatResponse, DelegatingChatClient, FunctionInvocationContext } from '.';
import { UsageDetails } from '../UsageDetails';
import { type AIContent, ChatMessage, FunctionCallContent, FunctionResultContent } from '../contents';
import { AIFunction, AIFunctionArguments } from '../functions';
import { ChatOptions } from './ChatOptions';
import { RequiredChatToolMode } from './RequiredChatToolMode';

enum ContinueMode {
  /**
   * Send back the responses and continue processing.
   */
  Continue = 0,

  /**
   * Send back the response but without any tools.
   */
  AllowOneMoreRoundtrip = 1,

  /**
   * Immediately exit the function calling loop.
   */
  Terminate = 2,
}

enum FunctionStatus {
  /**
   * The operation completed successfully.
   */
  CompletedSuccessfully,

  /**
   * The requested function could not be found.
   */
  NotFound,

  /**
   * The function call failed with an exception.
   */
  Failed,
}

export class FunctionInvocationResult {
  constructor({
    continueMode,
    status,
    callContent,
    result,
    exception,
  }: {
    continueMode: ContinueMode;
    status: FunctionStatus;
    callContent: FunctionCallContent;
    result?: unknown;
    exception?: Error;
  }) {
    this.continueMode = continueMode;
    this.status = status;
    this.callContent = callContent;
    this.result = result;
    this.exception = exception;
  }

  /**
   * Gets status about how the function invocation completed.
   */
  readonly status: FunctionStatus;

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
   * Gets an indication for how the caller should continue the processing loop.
   */
  readonly continueMode: ContinueMode;
}

export class FunctionInvokingChatClient extends DelegatingChatClient {
  private _currentContext?: FunctionInvocationContext;
  private _maximumIterationsPerRequest?: number;
  private _logger: Logger;
  public keepFunctionCallingMessages: boolean = true;
  public retryOnError: boolean = false;
  public detailedErrors: boolean = false;

  public get currentContext(): FunctionInvocationContext | undefined {
    return this._currentContext;
  }

  public set currentContext(value: FunctionInvocationContext | undefined) {
    this._currentContext = value;
  }

  public get maximumIterationsPerRequest() {
    return this._maximumIterationsPerRequest;
  }

  public set maximumIterationsPerRequest(value: number | undefined) {
    if (!value || value < 1) {
      throw new Error('The maximum iterations per request must be greater than or equal to 1.');
    }

    this._maximumIterationsPerRequest = value;
  }

  public constructor(innerClient: ChatClient) {
    super(innerClient);
    this._logger = LoggerFactory.getLogger();
  }

  override async getResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    let response: ChatResponse | undefined = undefined;
    let messagesToRemove: Set<ChatMessage> | undefined = undefined;
    let contentsToRemove: Set<AIContent> | undefined = undefined;
    let totalUsage: UsageDetails | undefined = undefined;

    try {
      for (let iteration = 0; ; iteration++) {
        response = await super.getResponse(chatMessages, options);

        if (response.usage) {
          totalUsage ??= new UsageDetails();
          totalUsage.add(response.usage);
        }

        if (
          !options ||
          !options.tools ||
          response.choices.length === 0 ||
          (this.maximumIterationsPerRequest && iteration >= this.maximumIterationsPerRequest)
        ) {
          break;
        }

        if (response.choices.length > 1) {
          throw new Error(
            'Automatic function call invocation only accepts a single choice, but multiple choices were received.'
          );
        }

        const functionCallContents = response.message.contents.filter(
          (content) => content instanceof FunctionCallContent
        );

        if (functionCallContents.length === 0) {
          break;
        }

        if (!this.keepFunctionCallingMessages) {
          messagesToRemove ??= new Set();
        }

        chatMessages.push(response.message);
        if (messagesToRemove) {
          if (functionCallContents.length === response.message.contents.length) {
            messagesToRemove.add(response.message);
          } else {
            contentsToRemove ??= new Set();
            functionCallContents.forEach(contentsToRemove.add, contentsToRemove);
          }
        }

        const modeAndMessages = await this.processFunctionCalls({
          chatMessages,
          options,
          functionCallContents,
          iteration,
        });

        if (modeAndMessages.messagesAdded && messagesToRemove) {
          modeAndMessages.messagesAdded.forEach(messagesToRemove.add, messagesToRemove);
        }

        switch (modeAndMessages.mode) {
          case ContinueMode.Continue:
            if (options.toolMode instanceof RequiredChatToolMode) {
              // We have to reset this after the first iteration, otherwise we'll be in an infinite loop.
              options = options.clone();
              options.toolMode = 'auto';
            }
            break;
          case ContinueMode.AllowOneMoreRoundtrip:
            // The LLM gets one further chance to answer, but cannot use tools.
            options = options.clone();
            options.tools = undefined;
            break;
          case ContinueMode.Terminate:
            return response;
        }
      }

      return response;
    } finally {
      this.removeMessagesAndContentFromList({
        messagesToRemove,
        contentToRemove: contentsToRemove,
        messages: chatMessages,
      });

      if (response) {
        response.usage = totalUsage;
      }
    }
  }

  override async *getStreamingResponse(chatMessages: string | ChatMessage[], options?: ChatOptions) {
    chatMessages = ChatMessage.create(chatMessages);
    let messagesToRemove: Set<ChatMessage> | undefined = undefined;
    let functionCallContents: FunctionCallContent[] = [];
    let choice: number | undefined;

    try {
      for (let iteration = 0; ; iteration++) {
        choice = undefined;
        functionCallContents = [];

        for await (const update of super.getStreamingResponse(chatMessages, options)) {
          // Find all the FCCs. We need to track these separately in order to be able to process them later.
          const preFccCount = functionCallContents.length;
          functionCallContents.push(...update.contents.filter((content) => content instanceof FunctionCallContent));

          // If there were any, remove them from the update. We do this before yielding the update so
          // that we're not modifying an instance already provided back to the caller.
          const addedFccs = functionCallContents.length - preFccCount;
          if (addedFccs > 0) {
            update.contents =
              addedFccs === update.contents.length
                ? []
                : update.contents.filter((content) => !(content instanceof FunctionCallContent));
          }

          // Only one choice is allowed with automatic function calling.
          if (choice === undefined) {
            choice = update.choiceIndex;
          } else if (choice !== update.choiceIndex) {
            throw new Error('Multiple choices were received.');
          }

          yield update;
        }

        // If there are no tools to call, or for any other reason we should stop, return the response.
        if (
          !options ||
          !options.tools ||
          functionCallContents.length === 0 ||
          (this.maximumIterationsPerRequest && iteration >= this.maximumIterationsPerRequest)
        ) {
          break;
        }

        // Track all added messages in order to remove them, if requested.
        if (this.keepFunctionCallingMessages) {
          messagesToRemove ??= new Set();
        }

        // Add a manufactured response message containing the function call contents to the chat history.
        const functionCallMessage = new ChatMessage({ role: 'assistant', contents: [...functionCallContents] });
        chatMessages.push(functionCallMessage);
        messagesToRemove?.add(functionCallMessage);

        // Process all of the functions, adding their results into the history.
        const modeAndMessages = await this.processFunctionCalls({
          chatMessages,
          options,
          functionCallContents,
          iteration,
        });
        if (modeAndMessages.messagesAdded && messagesToRemove) {
          modeAndMessages.messagesAdded.forEach(messagesToRemove.add, messagesToRemove);
        }

        // Decide how to proceed based on the result of the function calls.
        switch (modeAndMessages.mode) {
          case ContinueMode.Continue:
            // We have to reset this after the first iteration, otherwise we'll be in an infinite loop.
            if (options.toolMode instanceof RequiredChatToolMode) {
              options = options.clone();
              options.toolMode = 'auto';
            }
            break;
          case ContinueMode.AllowOneMoreRoundtrip:
            // The LLM gets one further chance to answer, but cannot use tools.
            options = options.clone();
            options.tools = undefined;
            break;
          case ContinueMode.Terminate:
            // Bail immediately.
            return;
        }
      }
    } finally {
      this.removeMessagesAndContentFromList({
        messagesToRemove,
        messages: chatMessages,
      });
    }
  }

  private async processFunctionCalls({
    chatMessages,
    options,
    functionCallContents,
    iteration,
  }: {
    chatMessages: ChatMessage[];
    options: ChatOptions;
    functionCallContents: FunctionCallContent[];
    iteration: number;
  }) {
    const functionCount = functionCallContents.length;

    if (functionCount === 1) {
      const result = await this.processFunctionCall({
        chatMessages,
        options,
        functionCallContent: functionCallContents[0],
        iteration,
        functionCallIndex: 0,
        totalFunctionCount: 1,
      });
      const added = this.addResponseMessages({ chat: chatMessages, results: [result] });
      return { mode: result.continueMode, messagesAdded: added };
    } else {
      const results: FunctionInvocationResult[] = [];

      // TODO: Implement ConcurrentInvocation

      // Invoke functions serially.
      for (let i = 0; i < functionCount; i++) {
        results.push(
          await this.processFunctionCall({
            chatMessages,
            options,
            functionCallContent: functionCallContents[i],
            iteration,
            functionCallIndex: i,
            totalFunctionCount: functionCount,
          })
        );
      }

      let continueMode = ContinueMode.Continue;
      const added = this.addResponseMessages({ chat: chatMessages, results });
      results.forEach((fir) => {
        if (fir.continueMode > continueMode) {
          continueMode = fir.continueMode;
        }
      });

      return { mode: continueMode, messagesAdded: added };
    }
  }

  private async processFunctionCall({
    chatMessages,
    options,
    functionCallContent,
    iteration,
    functionCallIndex,
    totalFunctionCount,
  }: {
    chatMessages: ChatMessage[];
    options: ChatOptions;
    functionCallContent: FunctionCallContent;
    iteration: number;
    functionCallIndex: number;
    totalFunctionCount: number;
  }) {
    const aiFunction: AIFunction | undefined = options.tools
      ?.filter((tool) => tool instanceof AIFunction)
      .find((tool) => tool.name === functionCallContent.name);

    if (!aiFunction) {
      return new FunctionInvocationResult({
        continueMode: ContinueMode.Continue,
        status: FunctionStatus.NotFound,
        callContent: functionCallContent,
      });
    }

    const context = new FunctionInvocationContext({
      chatMessages,
      args: new AIFunctionArguments(functionCallContent.arguments),
      functionCallContent,
      func: aiFunction,
    });
    context.iteration = iteration;
    context.functionCallIndex = functionCallIndex;
    context.functionCount = totalFunctionCount;

    try {
      const result = await this.invokeFunction(context);
      return new FunctionInvocationResult({
        continueMode: context.termination ? ContinueMode.Terminate : ContinueMode.Continue,
        status: FunctionStatus.CompletedSuccessfully,
        callContent: functionCallContent,
        result,
      });
    } catch (e) {
      return new FunctionInvocationResult({
        continueMode: this.retryOnError ? ContinueMode.Continue : ContinueMode.AllowOneMoreRoundtrip,
        status: FunctionStatus.Failed,
        callContent: functionCallContent,
        exception: e,
      });
    }
  }

  protected async invokeFunction(context: FunctionInvocationContext): Promise<unknown | undefined> {
    let result: unknown | undefined = undefined;

    this._logger.debug(`Invoking ${context.function.name}.`);
    this._logger.trace(`Invoking ${context.function.name}.`, { arguments: context.arguments });

    const startTimer = performance.now();

    try {
      this.currentContext = context;
      result = await context.function.invoke(context.arguments);

      const duration = performance.now() - startTimer;

      this._logger.debug(`${context.function.name} invocation completed.`);
      this._logger.trace(`${context.function.name} invocation completed.`, { result, duration });
    } catch (e) {
      this._logger.error(`${context.function.name} invocation failed`, { error: e });
      throw e;
    }

    return result;
  }

  private createFunctionResultContent(result: FunctionInvocationResult): FunctionResultContent {
    let functionResult: unknown | undefined;
    if (result.status === FunctionStatus.CompletedSuccessfully) {
      functionResult = result.result ?? 'Success: Function completed.';
    } else {
      let message = 'Error: Unknown error.';
      if (result.status === FunctionStatus.NotFound) {
        message = 'Error: Requested function not found.';
      } else if (result.status === FunctionStatus.Failed) {
        message = 'Error: Function failed.';
      }

      if (this.detailedErrors && result.exception) {
        message = `${message} Exception: ${result.exception}`;
      }

      functionResult = message;
    }

    const functionResultContent = new FunctionResultContent({
      callId: result.callContent.callId,
      name: result.callContent.name,
      result: functionResult,
    });
    functionResultContent.exception = result.exception;

    return functionResultContent;
  }

  protected addResponseMessages({
    chat,
    results,
  }: {
    chat: ChatMessage[];
    results: FunctionInvocationResult[];
  }): ChatMessage[] {
    const contents = results.map((result) => this.createFunctionResultContent(result));
    const message = new ChatMessage({ role: 'tool', contents });
    chat.push(message);
    return [message];
  }

  private removeMessagesAndContentFromList({
    messagesToRemove,
    contentToRemove,
    messages,
  }: {
    messagesToRemove?: Set<ChatMessage>;
    contentToRemove?: Set<AIContent>;
    messages: ChatMessage[];
  }) {
    if (messagesToRemove) {
      for (let m = messages.length - 1; m >= 0; m--) {
        const message = messages[m];

        if (contentToRemove) {
          for (let c = message.contents.length - 1; c >= 0; c--) {
            if (contentToRemove.has(message.contents[c])) {
              message.contents.splice(c, 1);
            }
          }
        }

        if (messages.length === 0 || messagesToRemove.has(messages[m])) {
          messages.splice(m, 1);
        }
      }
    }
  }
}

export const functionInvocation = (chatClient: ChatClient) => new FunctionInvokingChatClient(chatClient);
