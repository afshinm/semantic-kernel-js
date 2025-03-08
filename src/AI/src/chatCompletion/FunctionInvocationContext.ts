import { ChatMessage, FunctionCallContent } from '../contents';
import { AIFunction } from '../functions';

export class FunctionInvocationContext {
  function: AIFunction;
  callContent: FunctionCallContent;
  chatMessages: ChatMessage[];
  iteration?: number;
  functionCallIndex?: number;
  functionCount?: number;
  termination?: boolean;

  constructor({
    chatMessages,
    functionCallContent,
    func,
  }: {
    chatMessages: ChatMessage[];
    functionCallContent: FunctionCallContent;
    func: AIFunction;
  }) {
    this.function = func;
    this.callContent = functionCallContent;
    this.chatMessages = chatMessages;
  }
}
