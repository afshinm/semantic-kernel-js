import { ChatMessage, FunctionCallContent } from '../contents';
import { AIFunction } from '../functions';
import { AIFunctionArguments } from '../functions/AIFunctionArguments';

export class FunctionInvocationContext {
  function: AIFunction;
  callContent: FunctionCallContent;
  arguments: AIFunctionArguments;
  chatMessages: ChatMessage[];
  iteration?: number;
  functionCallIndex?: number;
  functionCount?: number;
  termination?: boolean;

  constructor({
    chatMessages,
    args,
    functionCallContent,
    func,
  }: {
    chatMessages: ChatMessage[];
    args: AIFunctionArguments;
    functionCallContent: FunctionCallContent;
    func: AIFunction;
  }) {
    this.chatMessages = chatMessages;
    this.arguments = args;
    this.callContent = functionCallContent;
    this.function = func;
  }
}
