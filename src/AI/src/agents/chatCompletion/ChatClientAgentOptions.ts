import { AITool } from '../../AITool';
import { ChatOptions } from '../../chatCompletion';
import { ChatMessageStore } from '../abstractions';

export class ChatClientAgentOptions {
  id?: string;
  name?: string;
  instructions?: string;
  description?: string;
  chatOptions?: ChatOptions;
  chatMessageStoreFactory?: () => ChatMessageStore;
  useProvidedChatClientAsIs?: boolean = false;

  constructor({
    instructions,
    name,
    description,
    tools,
  }: {
    instructions?: string;
    name?: string;
    description?: string;
    tools?: AITool[];
  }) {
    this.name = name;
    this.description = description;
    this.instructions = instructions;

    if (tools && tools.length > 0) {
      if (!this.chatOptions) {
        this.chatOptions = new ChatOptions();
      }

      this.chatOptions.tools = tools;
    }

    if (instructions) {
      if (!this.chatOptions) {
        this.chatOptions = new ChatOptions();
      }

      this.chatOptions.instructions = instructions;
    }
  }
}
