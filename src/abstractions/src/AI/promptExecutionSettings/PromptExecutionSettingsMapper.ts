import { PromptExecutionSettings } from '.';
import { Kernel } from '../../Kernel';
import { ChatOptions, ChatToolMode } from '../../chatCompletion';
import { AutoFunctionChoiceBehavior } from '../functionChoiceBehaviors';

export const toChatOptions = (settings: PromptExecutionSettings, kernel?: Kernel): ChatOptions => {
  const chatOptions = new ChatOptions({
    modelId: settings.modelId,
  });

  const functionChoiceBehaviorConfiguration = settings.functionChoiceBehavior?.getConfiguredOptions({
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

    chatOptions.tools = functionChoiceBehaviorFunctions;
  }

  return chatOptions;
};
