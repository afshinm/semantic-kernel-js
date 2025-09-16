import { ChatMessage, FunctionCallContent } from '../contents';
import { AIFunction } from '../functions';
import { AIFunctionArguments } from '../functions/AIFunctionArguments';
import { ChatOptions } from './ChatOptions';

export class FunctionInvocationContext {
  function: AIFunction;
  callContent: FunctionCallContent;
  arguments: AIFunctionArguments;
  messages: ChatMessage[];
  options?: ChatOptions;
  iteration?: number;
  functionCallIndex?: number;
  functionCount?: number;
  terminate?: boolean;
  isStreaming?: boolean;

  constructor({
    chatMessages,
    args,
    functionCallContent,
    func,
    options,
  }: {
    chatMessages: ChatMessage[];
    args: AIFunctionArguments;
    functionCallContent: FunctionCallContent;
    func: AIFunction;
    options?: ChatOptions;
  }) {
    this.messages = chatMessages;
    this.arguments = args;
    this.callContent = functionCallContent;
    this.function = func;
    this.options = options;
  }

  // Backward compatibility
  get chatMessages(): ChatMessage[] {
    return this.messages;
  }

  set chatMessages(value: ChatMessage[]) {
    this.messages = value;
  }

  get termination(): boolean | undefined {
    return this.terminate;
  }

  set termination(value: boolean | undefined) {
    this.terminate = value;
  }
}
