import {
  AIContent,
  AIFunction,
  AutoChatToolMode,
  ChatMessage,
  ChatOptions,
  FunctionCallContent,
  FunctionResultContent,
  RequiredChatToolMode,
  TextContent,
} from '@semantic-kernel/abstractions';
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
      chatCompletionCreateParams.logit_bias = chatOptions.additionalProperties.get('logit_bias') as Record<
        number,
        number
      >;
    }

    if (chatOptions.additionalProperties.has('parallel_tool_calls')) {
      chatCompletionCreateParams.parallel_tool_calls = chatOptions.additionalProperties.get(
        'parallel_tool_calls'
      ) as boolean;
    }

    if (chatOptions.additionalProperties.has('top_logprobs')) {
      chatCompletionCreateParams.top_logprobs = chatOptions.additionalProperties.get('top_logprobs') as number;
    }
  }

  if (chatOptions.tools?.length) {
    for (const tool of chatOptions.tools) {
      if (tool instanceof AIFunction) {
        if (!chatCompletionCreateParams.tools) {
          chatCompletionCreateParams.tools = [];
        }

        chatCompletionCreateParams.tools.push(toOpenAIChatTool(tool));
      }
    }

    if (chatOptions.toolMode instanceof AutoChatToolMode) {
      chatCompletionCreateParams.tool_choice = 'auto';
    } else if (chatOptions.toolMode instanceof RequiredChatToolMode) {
      chatCompletionCreateParams.tool_choice = chatOptions.toolMode.requiredFunctionName
        ? {
            function: {
              name: chatOptions.toolMode.requiredFunctionName,
            },
            type: 'function',
          }
        : 'required';
    }
  }

  return chatCompletionCreateParams;
};

const toOpenAIChatTool = (aiFunction: AIFunction): OpenAI.Chat.Completions.ChatCompletionTool => {
  const strict = aiFunction.metadata.additionalProperties?.get('strict') === true;

  const functionDefinition = {
    name: aiFunction.metadata.name,
    description: aiFunction.metadata.description,
    parameters: aiFunction.metadata.parameters,
    strict,
  };

  return {
    type: 'function',
    function: functionDefinition,
  };
};

/**
 * Converts a list of AIContent to a list of ChatCompletionContentPart"
 */
const toOpenAIChatContent = (contents: AIContent[]): OpenAI.Chat.ChatCompletionContentPart[] => {
  const parts: OpenAI.Chat.ChatCompletionContentPart[] = [];

  for (const content of contents) {
    if (content instanceof TextContent) {
      parts.push({ type: 'text', text: content.text });
    }
    // TODO: cover other content types e.g. ImageContent
  }

  if (parts.length === 0) {
    parts.push({
      type: 'text',
      text: '',
    });
  }

  return parts;
};

export const toOpenAIChatMessages = (inputs: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] => {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  for (const input of inputs) {
    if (input.role === 'system') {
      const parts = toOpenAIChatContent(input.contents) as OpenAI.Chat.ChatCompletionContentPartText[];
      messages.push({
        role: input.role,
        name: input.authorName,
        content: parts,
      });
    } else if (input.role === 'user') {
      const parts = toOpenAIChatContent(input.contents);
      messages.push({
        role: 'user',
        name: input.authorName,
        content: parts,
      });
    } else if (input.role === 'tool') {
      for (const item of input.contents) {
        if (item instanceof FunctionResultContent) {
          let result = item.result as string;

          if (!result && item.result) {
            try {
              result = JSON.stringify(item.result);
            } catch {
              // If the type can't be serialized, skip it.
            }
          }

          messages.push({
            role: 'tool',
            tool_call_id: item.callId,
            content: result || '',
          });
        }
      }
    } else if (input.role === 'assistant') {
      const message: OpenAI.Chat.ChatCompletionAssistantMessageParam = {
        role: 'assistant',
        name: input.authorName,
        content: toOpenAIChatContent(input.contents) as OpenAI.Chat.ChatCompletionContentPartText[],
      };

      for (const content of input.contents) {
        if (content instanceof FunctionCallContent) {
          if (!message.tool_calls) {
            message.tool_calls = [];
          }

          message.tool_calls.push({
            id: content.callId,
            type: 'function',
            function: {
              name: content.name,
              arguments: JSON.stringify(content.arguments),
            },
          });
        }
      }

      message.refusal = input.additionalProperties?.get('refusal') as string | undefined | null;

      messages.push(message);
    }
  }
  
  return messages;
}
