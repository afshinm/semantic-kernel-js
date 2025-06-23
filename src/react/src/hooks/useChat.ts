import { useCallback, useState } from 'react';
import { ChatMessage, ChatResponseStream, ChatResponseUpdate } from 'semantic-kernel';

export type UseChatProps = {
  apiEndpoint?: string;
};

export function useChat(props?: UseChatProps) {
  const [messages, setMessages] = useState<(ChatResponseUpdate[] | ChatMessage)[]>([]);

  const invoke = useCallback(
    async (prompt: string) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, new ChatMessage({ role: 'user', content: prompt })]);
      }, 0);

      const response = await fetch(props?.apiEndpoint ?? '/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP request failed with status code: ${response.status}`);
      }

      const reader = response.body;

      if (!reader) {
        throw new Error('Failed to get reader from response body');
      }

      for await (const update of new ChatResponseStream(reader)) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (Array.isArray(last)) {
            // Append update to the last array of updates
            return [...prev.slice(0, -1), [...last, update]];
          }
          // Start a new array of updates
          return [...prev, [update]];
        });
      }
    },
    [setMessages]
  );

  return { invoke, messages };
}
