import { useEffect, useState } from 'react';
import { ChatClient, ChatMessage, TextContent } from 'semantic-kernel';
import { useKernel, useKernelProps } from '../useKernel';

export type useChatProps = useKernelProps;

export const useChat = (props: useChatProps) => {
  const { kernel } = useKernel(props);
  const [chatClient, setChatClient] = useState<ChatClient>();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!kernel) return;

    const chatClient = kernel.services.getService(ChatClient);

    if (!chatClient) {
      throw new Error('ChatClient not found');
    }

    setChatClient(chatClient);
  }, [kernel]);

  const prompt = async (prompt: string) => {
    if (!chatClient) {
      console.error('ChatClient not found');
      return;
    }

    const newChatHistory = [
      ...chatHistory,
      new ChatMessage({
        role: 'user',
        contents: [new TextContent(prompt)],
      }),
    ];
    setChatHistory(newChatHistory);

    const chatMessageContents = await chatClient.complete(newChatHistory);

    for (const chatMessageContent of chatMessageContents.choices) {
      setChatHistory((chatHistory) => [...chatHistory, chatMessageContent]);
    }
  };

  return {
    prompt,
    chatHistory,
  };
};
