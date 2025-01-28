import { UsageDetails } from '../UsageDetails';
import { AIContent, FunctionCallContent, FunctionResultContent } from '../contents';
import { AIFunction } from '../functions';
import { ChatClient } from './ChatClient';
import { ChatCompletion } from './ChatCompletion';
import { ChatMessage } from './ChatMessage';
import { ChatOptions } from './ChatOptions';
import { DelegatingChatClient } from './DelegatingChatClient';
import { FunctionInvocationContext } from './FunctionInvocationContext';
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
  }

  override async complete(chatMessages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion> {
    let response: ChatCompletion | undefined = undefined;
    let messagesToRemove: Set<ChatMessage> | undefined = undefined;
    let contentsToRemove: Set<AIContent> | undefined = undefined;
    let totalUsage: UsageDetails | undefined = undefined;

    try {
      for (let iteration = 0; ; iteration++) {
        response = await super.complete(chatMessages, options);

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
      .find((tool) => tool.metadata.name === functionCallContent.name);

    if (!aiFunction) {
      return new FunctionInvocationResult({
        continueMode: ContinueMode.Continue,
        status: FunctionStatus.NotFound,
        callContent: functionCallContent,
      });
    }

    const context = new FunctionInvocationContext({
      chatMessages,
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

    try {
      this.currentContext = context;
      result = await context.function.invoke(context.callContent.arguments);
    } catch (e) {
      console.error('Error invoking function', e);
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
