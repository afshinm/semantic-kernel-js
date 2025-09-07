import { type ChatOptions } from '../../chatCompletion/ChatOptions';
import { AgentRunOptions } from '../abstractions/AgentRunOptions';

export class ChatClientAgentRunOptions extends AgentRunOptions {
  chatOptions?: ChatOptions;

  constructor(chatOptions?: ChatOptions) {
    super();
    this.chatOptions = chatOptions;
  }
}
