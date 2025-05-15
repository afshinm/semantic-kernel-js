import { ChatOptions, ChatResponseFormat, ChatResponseFormatJson, ChatToolMode } from '@semantic-kernel/ai';
import { PromptExecutionSettings } from '.';
import { Kernel } from '../Kernel';
import { AutoFunctionChoiceBehavior } from '../functionChoiceBehaviors';

export const toChatOptions = (settings?: PromptExecutionSettings, kernel?: Kernel): ChatOptions | undefined => {
  if (!settings) {
    return undefined;
  }

  const chatOptions = new ChatOptions({
    modelId: settings.modelId,
  });

  if (settings.extensionData) {
    for (const [key, value] of settings.extensionData) {
      if (key === 'temperature' && typeof value === 'number') {
        chatOptions.temperature = value;
      } else if (key === 'top_p' && typeof value === 'number') {
        chatOptions.topP = value;
      } else if (key === 'top_k' && typeof value === 'number') {
        chatOptions.topK = value;
      } else if (key === 'seed' && typeof value === 'number') {
        chatOptions.seed = value;
      } else if (key === 'max_tokens' && typeof value === 'number') {
        chatOptions.maxOutputTokens = value;
      } else if (key === 'frequency_penalty' && typeof value === 'number') {
        chatOptions.frequencyPenalty = value;
      } else if (key === 'presence_penalty' && typeof value === 'number') {
        chatOptions.presencePenalty = value;
      } else if (key === 'stop_sequences' && value instanceof Array) {
        chatOptions.stopSequences = value;
      } else if (key === 'response_format') {
        if (value === 'text') {
          chatOptions.responseFormat = ChatResponseFormat.Text;
        } else if (value === 'json_object') {
          chatOptions.responseFormat = ChatResponseFormat.Json;
        } else if (value instanceof Object) {
          chatOptions.responseFormat = new ChatResponseFormatJson({
            schema: value,
          });
        }
      } else {
        (chatOptions.additionalProperties ??= new Map()).set(key, value);
      }
    }
  }

  const functionChoiceBehaviorConfiguration = settings.functionChoiceBehavior?.getConfiguredOptions({
    // TODO: is this needed?
    requestSequenceIndex: 0,
    chatHistory: [],
    kernel,
  });

  const functionChoiceBehaviorFunctions = functionChoiceBehaviorConfiguration?.functions ?? [];
  
  if (functionChoiceBehaviorFunctions.length > 0) {
    if (settings.functionChoiceBehavior instanceof AutoFunctionChoiceBehavior) {
      chatOptions.toolMode = ChatToolMode.Auto;
    } else {
      // TODO: handle the FunctionChoiceBehaviorNone / FunctionChoiceBehaviorManual modes
      chatOptions.toolMode = ChatToolMode.RequireAny;
    }

    chatOptions.tools = functionChoiceBehaviorFunctions.map((fn) => fn.asAIFunction(kernel));
  }

  return chatOptions;
};
