import { ChatHistory } from '../../AI/chatCompletion';
import { FunctionChoiceBehaviorConfiguration } from '../../AI/functionChoiceBehaviors';
import { FunctionChoiceBehaviorBase } from '../../AI/functionChoiceBehaviors/FunctionChoiceBehaviorBase';
import { Kernel } from '../../Kernel';
import { ChatMessageContent, FunctionCallContent, 
  //FunctionResultContent
} from '../../contents';

/**
 * The maximum number of function auto-invokes that can be made in a single user request.
 */
const MaximumAutoInvokeAttempts = 128;

export class FunctionCallsProcessor {
  public GetConfiguration(
    chatHistory: ChatHistory,
    requestIndex: number,
    behavior?: FunctionChoiceBehaviorBase,
    kernel?: Kernel
  ): FunctionChoiceBehaviorConfiguration | undefined {
    if (!behavior) {
      return undefined;
    }

    const configuration = behavior.getConfiguredOptions({ requestSequenceIndex: requestIndex, chatHistory, kernel });

    configuration.autoInvoke = kernel !== undefined && configuration.autoInvoke;

    const maximumAutoInvokeAttempts = configuration.autoInvoke ? MaximumAutoInvokeAttempts : 0;

    if (requestIndex >= maximumAutoInvokeAttempts) {
      configuration.autoInvoke = false;
    }

    return configuration;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async ProcessFunctionCalls(_props: {
    chatMessageContent: ChatMessageContent;
    chatHistory: ChatHistory;
    requestIndex: number;
    checkIfFunctionAdvertised: (functionCallContent: FunctionCallContent) => boolean;
    kernel?: Kernel;
  }): Promise<ChatMessageContent | undefined> {
      return undefined;
    // const functionCalls = FunctionCallContent.getFunctionCalls(chatMessageContent);

    // if (!functionCalls) {
    //   return undefined;
    // }

    // if (!kernel) {
    //   throw new Error('Kernel is required to process function calls.');
    // }

    // chatHistory.push(chatMessageContent);

    // for (let functionCallIndex = 0; functionCallIndex < functionCalls?.length; functionCallIndex++) {
    //   const functionCall = functionCalls[functionCallIndex];

    //   if (!checkIfFunctionAdvertised(functionCall)) {
    //     this.addFunctionCallToChatHistory({
    //       chatHistory,
    //       functionCall,
    //       result: undefined,
    //       errorMessage: `Function call request for a function ${functionCall.functionName} that was not defined.`,
    //     });
    //     continue;
    //   }

    //   const kernelFunction = kernel?.plugins.getFunction(functionCall.functionName, functionCall.pluginName);

    //   if (!kernelFunction) {
    //     this.addFunctionCallToChatHistory({
    //       chatHistory,
    //       functionCall,
    //       result: undefined,
    //       errorMessage: `The specified function ${functionCall.functionName} is not available in the kernel.`,
    //     });
    //     continue;
    //   }

    //   try {
    //     const functionResult = await kernelFunction.invoke(kernel, functionCall.arguments);
    //     const functionResultValue = FunctionCallsProcessor.processFunctionResult(functionResult?.value ?? '');
    //     this.addFunctionCallToChatHistory({ chatHistory, functionCall, result: functionResultValue });
    //   } catch (e) {
    //     this.addFunctionCallToChatHistory({
    //       chatHistory,
    //       functionCall,
    //       result: undefined,
    //       errorMessage: `Error while invoking function: ${e.message}`,
    //     });
    //     continue;
    //   }

    //   // TODO: Handle the case where the function call is terminated early and return the last result.
    // }
  }

  // private addFunctionCallToChatHistory({
  //   chatHistory,
  //   // functionCall,
  //   // result,
  //   // errorMessage,
  // }: {
  //   chatHistory: ChatHistory;
  //   functionCall: FunctionCallContent;
  //   result?: string;
  //   errorMessage?: string;
  // }) {
  //   // result = result ?? errorMessage ?? '';

  //   const message = new ChatMessageContent<'tool'>({
  //     role: 'tool',
  //     items: [
  //       // new FunctionResultContent({
  //       //   callId: functionCall.id,
  //       //   result,
  //       //   functionName: functionCall.functionName,
  //       //   pluginName: functionCall.pluginName,
  //       // }),
  //     ],
  //   });

  //   chatHistory.push(message);
  // }

  // static processFunctionResult<T>(functionResult: T) {
  //   if (typeof functionResult === 'string') {
  //     return functionResult;
  //   }

  //   // This is an optimization to use ChatMessageContent content directly
  //   // without unnecessary serialization of the whole message content class.
  //   if (functionResult instanceof ChatMessageContent) {
  //     return functionResult.content ?? '';
  //   }

  //   return JSON.stringify(functionResult);
  // }
}
