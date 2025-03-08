import { OpenAIChatClient } from '@semantic-kernel/openai';
import { useEffect, useState } from 'react';
import { ChatClient, Kernel, kernel } from 'semantic-kernel';

export type useKernelProps = {
  openAIModel?: string;
  openAIApiKey?: string;
  openAIorganization?: string;
  kernel?: Kernel;
  chatClient?: ChatClient;
};

export const useKernel = (props: useKernelProps) => {
  const [sk, setSK] = useState<Kernel | undefined>();

  useEffect(() => {
    if (!sk) {
      setSK(props.kernel ?? kernel());
    }
  }, []);

  useEffect(() => {
    if (!sk) return;

    if (props.chatClient) {
      sk.addService(props.chatClient);
    } else if (props.openAIApiKey && props.openAIModel) {
      sk.addService(
        new OpenAIChatClient({
          modelId: props.openAIModel,
          apiKey: props.openAIApiKey,
        })
      );
    } else {
      throw new Error('Either chatCompletionService or openAIModel and openAIApiKey are required.');
    }
  }, [sk]);

  return {
    kernel: sk,
  };
};
