import { ChatOptions } from '@semantic-kernel/abstractions';
import OpenAI from 'openai';

export const toOpenAIChatOptions = (
  chatOptions?: ChatOptions
): Omit<OpenAI.Chat.ChatCompletionCreateParams, 'messages' | 'model'> => {
  if (!chatOptions) {
    return {};
  }

  const chatCompletionCreateParams: Omit<OpenAI.Chat.ChatCompletionCreateParams, 'messages' | 'model'> = {};

  chatCompletionCreateParams.frequency_penalty = chatOptions.frequencyPenalty;
  chatCompletionCreateParams.max_tokens = chatOptions.maxOutputTokens;
  chatCompletionCreateParams.top_p = chatOptions.topP;
  chatCompletionCreateParams.presence_penalty = chatOptions.presencePenalty;
  chatCompletionCreateParams.temperature = chatOptions.temperature;
  chatCompletionCreateParams.seed = chatOptions.seed;

  if (chatOptions.stopSequences) {
    chatCompletionCreateParams.stop = [...chatOptions.stopSequences];
  }

  if (chatOptions.additionalProperties?.size) {
    if (chatOptions.additionalProperties.has('user')) {
      chatCompletionCreateParams.user = chatOptions.additionalProperties.get('user') as string;
    }

    if (chatOptions.additionalProperties.has('logprobs')) {
      chatCompletionCreateParams.logprobs = chatOptions.additionalProperties.get('logprobs') as boolean;
    }

    if (chatOptions.additionalProperties.has('logit_bias')) {
      chatCompletionCreateParams.logit_bias = chatOptions.additionalProperties.get('logit_bias') as Record<number, number>;
    }

    if (chatOptions.additionalProperties.has('parallel_tool_calls')) {
      chatCompletionCreateParams.parallel_tool_calls = chatOptions.additionalProperties.get('parallel_tool_calls') as boolean;
    }

    if (chatOptions.additionalProperties.has('top_logprobs')) {
      chatCompletionCreateParams.top_logprobs = chatOptions.additionalProperties.get('top_logprobs') as number;
    }
  }

  return chatCompletionCreateParams;
};
