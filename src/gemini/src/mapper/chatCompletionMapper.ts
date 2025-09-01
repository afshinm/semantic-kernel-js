import {
  Content,
  FinishReason,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  GenerateContentParameters,
  GenerateContentResponse,
  Part,
} from '@google/genai';
import {
  AIContent,
  AIFunction,
  AutoChatToolMode,
  ChatFinishReason,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatResponseUpdate,
  ChatRole,
  FunctionCallContent,
  FunctionResultContent,
  NoneChatToolMode,
  RequiredChatToolMode,
  TextContent,
  UsageDetails,
} from '@semantic-kernel/ai';

export const toGeminiChatOptions = (
  chatOptions?: ChatOptions
): Omit<GenerateContentParameters, 'contents' | 'model'> => {
  if (!chatOptions) {
    return {};
  }

  const generateContentRequest: Omit<GenerateContentParameters, 'contents' | 'model'> = {};
  generateContentRequest.config = {};

  if (chatOptions.temperature !== undefined) {
    generateContentRequest.config = {
      ...generateContentRequest.config,
      temperature: chatOptions.temperature,
    };
  }

  if (chatOptions.maxOutputTokens !== undefined) {
    generateContentRequest.config = {
      ...generateContentRequest.config,
      maxOutputTokens: chatOptions.maxOutputTokens,
    };
  }

  if (chatOptions.topP !== undefined) {
    generateContentRequest.config = {
      ...generateContentRequest.config,
      topP: chatOptions.topP,
    };
  }

  if (chatOptions.stopSequences?.length) {
    generateContentRequest.config = {
      ...generateContentRequest.config,
      stopSequences: [...chatOptions.stopSequences],
    };
  }

  if (chatOptions.tools?.length) {
    const functions: FunctionDeclaration[] = [];

    for (const tool of chatOptions.tools) {
      if (tool instanceof AIFunction) {
        functions.push(toGeminiFunctionDeclaration(tool));
      }
    }

    if (functions.length > 0) {
      generateContentRequest.config.tools = [{ functionDeclarations: functions }];
    }

    // Handle tool mode
    if (chatOptions.toolMode instanceof AutoChatToolMode) {
      generateContentRequest.config.toolConfig = { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } };
    } else if (chatOptions.toolMode instanceof NoneChatToolMode) {
      generateContentRequest.config.toolConfig = { functionCallingConfig: { mode: FunctionCallingConfigMode.NONE } };
    } else if (chatOptions.toolMode instanceof RequiredChatToolMode) {
      generateContentRequest.config.toolConfig = { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY } };
    }
  }

  return generateContentRequest;
};

const toGeminiFunctionDeclaration = (aiFunction: AIFunction): FunctionDeclaration => {
  return {
    name: aiFunction.name,
    description: aiFunction.description || '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters: aiFunction.schema as any, // Gemini expects a specific schema format
  };
};

/**
 * Converts a list of AIContent to Gemini Part objects
 */
const toGeminiParts = (contents: AIContent[]): Part[] => {
  const parts: Part[] = [];

  for (const content of contents) {
    if (content instanceof TextContent) {
      parts.push({ text: content.text });
    } else if (content instanceof FunctionCallContent) {
      parts.push({
        functionCall: {
          name: content.name,
          args: content.arguments || {},
        },
      });
    } else if (content instanceof FunctionResultContent) {
      parts.push({
        functionResponse: {
          name: content.name || '',
          response: content.result as Record<string, unknown>,
        },
      });
    }
  }

  if (parts.length === 0) {
    parts.push({ text: '' });
  }

  return parts;
};

export const toGeminiContent = (inputs: ChatMessage[]): Content[] => {
  const contents: Content[] = [];

  for (const input of inputs) {
    let role: 'user' | 'model';

    if (input.role === 'system') {
      // Gemini doesn't have a system role, so we'll prepend it as user content
      role = 'user';
    } else if (input.role === 'assistant') {
      role = 'model';
    } else {
      role = 'user';
    }

    const parts = toGeminiParts(input.contents);

    contents.push({
      role,
      parts,
    });
  }

  return contents;
};

/**
 * Converts a Gemini finish reason to a ChatFinishReason
 */
const fromGeminiFinishReason = (finishReason?: FinishReason): ChatFinishReason | undefined => {
  if (!finishReason) {
    return undefined;
  }

  switch (finishReason) {
    case 'STOP':
      return 'stop';
    case 'MAX_TOKENS':
      return 'length';
    case 'SAFETY':
      return 'content_filter';
    case 'RECITATION':
      return 'content_filter';
    case 'OTHER':
      return 'stop';
    default:
      return 'stop';
  }
};

const fromGeminiUsage = (usageMetadata?: {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}): UsageDetails | undefined => {
  if (!usageMetadata) {
    return undefined;
  }

  const usageDetails = new UsageDetails();
  usageDetails.inputTokenCount = usageMetadata.promptTokenCount || 0;
  usageDetails.outputTokenCount = usageMetadata.candidatesTokenCount || 0;
  usageDetails.totalTokenCount = usageMetadata.totalTokenCount || 0;

  return usageDetails;
};

export const fromGeminiChatCompletion = ({
  geminiResponse,
  options,
}: {
  geminiResponse: GenerateContentResponse;
  options?: ChatOptions;
}): ChatResponse => {
  const candidate = geminiResponse.candidates?.[0];
  if (!candidate) {
    throw new Error('No candidate found in Gemini response');
  }

  const content = candidate.content;
  const textParts = content?.parts?.filter((part) => 'text' in part);
  const functionCallParts = content?.parts?.filter((part) => 'functionCall' in part);

  const messageContent = textParts?.map((part) => part.text).join('');

  const returnMessage = new ChatMessage({
    content: messageContent,
    role: 'assistant',
  });
  returnMessage.rawRepresentation = geminiResponse;

  // Handle function calls
  if (options?.tools?.length && functionCallParts && functionCallParts.length > 0) {
    for (const part of functionCallParts) {
      if ('functionCall' in part && part.functionCall) {
        const callContent = new FunctionCallContent({
          name: part.functionCall.name ?? '',
          callId: part.functionCall.name ?? '', // Gemini doesn't provide call IDs, use function name
          arguments: (part.functionCall.args || {}) as Record<string, unknown>,
        });
        callContent.rawRepresentation = part;
        returnMessage.contents.push(callContent);
      }
    }
  }

  const completion = new ChatResponse({
    message: returnMessage,
  });
  completion.rawRepresentation = geminiResponse;
  completion.finishReason = fromGeminiFinishReason(candidate.finishReason);

  if (geminiResponse.usageMetadata) {
    completion.usage = fromGeminiUsage(geminiResponse.usageMetadata);
  }

  return completion;
};

export const fromGeminiStreamingChatCompletion = async function* (
  streamResultPromise: Promise<AsyncGenerator<GenerateContentResponse>>
) {
  const streamedRole: ChatRole = 'assistant';
  let finishReason: ChatFinishReason | undefined = undefined;

  const streamResult = await streamResultPromise;

  for await (const chunk of streamResult) {
    const candidate = chunk.candidates?.[0];
    if (!candidate) continue;

    finishReason = fromGeminiFinishReason(candidate.finishReason);

    const completionUpdate = new ChatResponseUpdate();
    completionUpdate.finishReason = finishReason;
    completionUpdate.rawRepresentation = chunk;
    completionUpdate.role = streamedRole;

    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if ('text' in part && part.text) {
          const aiContent = new TextContent(part.text);
          completionUpdate.contents.push(aiContent);
        } else if ('functionCall' in part && part.functionCall) {
          const callContent = new FunctionCallContent({
            callId: part.functionCall.name ?? '',
            name: part.functionCall.name ?? '',
            arguments: (part.functionCall.args || {}) as Record<string, unknown>,
          });
          completionUpdate.contents.push(callContent);
        }
      }
    }

    yield completionUpdate;
  }
};
