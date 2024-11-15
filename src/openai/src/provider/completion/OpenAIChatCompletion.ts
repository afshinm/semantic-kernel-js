import { OpenAIFunctionNameSeparator } from '../../OpenAIFunction';
import { OpenAIChatMessageContent } from '../../chatCompletion';
import { OpenAIPromptExecutionSettings } from '../../openAIPromptExecutionSettings';
import { createChatCompletionCreateParams } from './chatCompletionParams';
import {
  ChatHistory,
  FunctionCallContent,
  FunctionCallsProcessor,
  FunctionName,
  Kernel,
} from '@semantic-kernel/abstractions';
import OpenAI from 'openai';

export type OpenAIChatCompletionParams = {
  model: string;
  chatHistory: ChatHistory;
  executionSettings?: OpenAIPromptExecutionSettings;
  kernel?: Kernel;
};

export class OpenAIChatCompletion {
  private readonly openAIClient: OpenAI;
  private readonly functionCallsProcessor: FunctionCallsProcessor;

  public constructor(openAIClient: OpenAI) {
    this.openAIClient = openAIClient;
    this.functionCallsProcessor = new FunctionCallsProcessor();
  }

  public getChatMessageContent = async ({
    model,
    chatHistory,
    executionSettings,
    kernel,
  }: OpenAIChatCompletionParams) => {
    for (let requestIndex = 1; ; requestIndex++) {
      // TODO record completion activity
      const functionCallingConfig = executionSettings?.functionChoiceBehavior?.getConfiguredOptions({
        requestSequenceIndex: requestIndex,
        chatHistory,
        kernel,
      });

      const chatCompletionCreateParams = createChatCompletionCreateParams(
        model,
        chatHistory,
        executionSettings,
        functionCallingConfig
      );
      const chatCompletion = await this.openAIClient.chat.completions.create(chatCompletionCreateParams);
      const chatMessageContent = new OpenAIChatMessageContent({ chatCompletion, model });

      // If we don't want to attempt to invoke any functions, just return the result.
      if (!functionCallingConfig?.autoInvoke) {
        return [chatMessageContent];
      }

      // Get our single result and extract the function call information. If this isn't a function call, or if it is
      // but we're unable to find the function or extract the relevant information, just return the single result.
      // Note that we don't check the FinishReason and instead check whether there are any tool calls, as the service
      // may return a FinishReason of "stop" even if there are tool calls to be made, in particular if a required tool
      // is specified.
      if (!chatCompletion.choices[0].message.tool_calls) {
        return [chatMessageContent];
      }

      await this.functionCallsProcessor.ProcessFunctionCalls({
        chatMessageContent,
        chatHistory,
        requestIndex,
        checkIfFunctionAdvertised: (functionCallContent) =>
          OpenAIChatCompletion.checkIfFunctionAdvertised(functionCallContent, chatCompletionCreateParams.tools),
        kernel,
      });
    }
  };

  private static checkIfFunctionAdvertised(
    functionCallContent: FunctionCallContent,
    tools?: OpenAI.ChatCompletionTool[]
  ) {
    if (!tools) {
      return false;
    }

    for (const tool of tools) {
      if (tool.type !== 'function') {
        continue;
      }

      if (
        tool.function.name ===
        FunctionName.fullyQualifiedName({
          functionName: functionCallContent.functionName,
          pluginName: functionCallContent.pluginName,
          nameSeparator: OpenAIFunctionNameSeparator,
        })
      ) {
        return true;
      }
    }

    return false;
  }
}
