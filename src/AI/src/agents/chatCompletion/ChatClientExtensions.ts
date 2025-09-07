import { ChatClient, functionInvocation, FunctionInvokingChatClient } from '../../chatCompletion';
import { agentInvocation, AgentInvokedChatClient } from './AgentInvokedChatClient';
import { ChatClientAgentOptions } from './ChatClientAgentOptions';

export const asAgentInvokedChatClient = (chatClient: ChatClient, options?: ChatClientAgentOptions) => {
  const chatClientBuilder = chatClient.asBuilder();

  if (chatClient instanceof AgentInvokedChatClient) {
    chatClientBuilder.use(agentInvocation);
  }

  if (!chatClient.getService(FunctionInvokingChatClient)) {
    chatClientBuilder.use(functionInvocation);
  }

  const agentChatClient = chatClientBuilder.build();

  if (options?.chatOptions?.tools?.length) {
    const functionInvokingClient = agentChatClient.getService(FunctionInvokingChatClient) as
      | FunctionInvokingChatClient
      | undefined;

    if (functionInvokingClient) {
      functionInvokingClient.additionalTools = options.chatOptions.tools;
    }
  }

  return agentChatClient;
};
