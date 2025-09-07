import { type ChatClient, DelegatingChatClient } from '../../chatCompletion';

export class AgentInvokedChatClient extends DelegatingChatClient {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(chatClient: ChatClient) {
    super(chatClient);
  }
}

export const agentInvocation = (chatClient: ChatClient) => new AgentInvokedChatClient(chatClient);
