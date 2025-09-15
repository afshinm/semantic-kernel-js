import { type AIContent } from '../contents/AIContent';
import { ChatMessage } from '../contents/ChatMessage';
import { TextContent } from '../contents/TextContent';
import { TextReasoningContent } from '../contents/TextReasoningContent';
import { UsageDetails } from '../UsageDetails';
import { ChatResponse } from './ChatResponse';
import { type ChatResponseUpdate } from './ChatResponseUpdate';

export const toChatResponse = (updates: ChatResponseUpdate[]): ChatResponse => {
  const chatResponse = new ChatResponse();

  for (const update of updates) {
    processUpdate(update, chatResponse);
  }

  finalizeResponse(chatResponse);

  return chatResponse;
};

const processUpdate = (update: ChatResponseUpdate, response: ChatResponse) => {
  // If there is no message created yet, or if the last update we saw had a different
  // message ID or role than the newest update, create a new message.
  let message: ChatMessage;
  let isNewMessage = false;
  if (response.messages.length === 0) {
    isNewMessage = true;
  } else if (
    update.messageId &&
    response.messages[response.messages.length - 1].messageId &&
    update.messageId !== response.messages[response.messages.length - 1].messageId
  ) {
    isNewMessage = true;
  } else if (
    update.role &&
    response.messages[response.messages.length - 1].role &&
    update.role !== response.messages[response.messages.length - 1].role
  ) {
    isNewMessage = true;
  }

  if (isNewMessage) {
    message = new ChatMessage({ role: update.role ?? 'assistant', contents: [] });
    response.messages.push(message);
  } else {
    message = response.messages[response.messages.length - 1];
  }

  // Some members on ChatResponseUpdate map to members of ChatMessage.
  // Incorporate those into the latest message; in cases where the message
  // stores a single value, prefer the latest update's value over anything
  // stored in the message.

  if (update.authorName) {
    message.authorName = update.authorName;
  }

  if (update.createdAt) {
    message.createdAt = update.createdAt;
  }

  if (update.role) {
    message.role = update.role;
  }

  if (update.messageId) {
    // Note that this must come after the message checks earlier, as they depend
    // on this value for change detection.
    message.messageId = update.messageId;
  }

  for (const content of update.contents) {
    if (content instanceof UsageDetails) {
      if (!response.usage) {
        response.usage = new UsageDetails();
      }
      response.usage.add(content);
    } else {
      message.contents.push(content);
    }
  }

  // Other members on a ChatResponseUpdate map to members of the ChatResponse.
  // Update the response object with those, preferring the values from later updates.

  if (update.responseId) {
    response.responseId = update.responseId;
  }

  if (update.conversationId) {
    response.conversationId = update.conversationId;
  }

  if (update.createdAt) {
    response.createdAt = update.createdAt;
  }

  if (update.finishReason) {
    response.finishReason = update.finishReason;
  }

  if (update.modelId) {
    response.modelId = update.modelId;
  }

  if (update.additionalProperties) {
    if (!response.additionalProperties) {
      response.additionalProperties = { ...update.additionalProperties };
    } else {
      response.additionalProperties = { ...response.additionalProperties, ...update.additionalProperties };
    }
  }
};

const finalizeResponse = (chatResponse: ChatResponse) => {
  for (const message of chatResponse.messages) {
    coalesceTextContent(message.contents);
  }
};

export function coalesceTextContent(contents: AIContent[]): void {
  coalesce<TextContent>(contents, TextContent, false, (contents, start, end) => {
    const newTextContent = new TextContent(mergeText(contents, start, end));
    newTextContent.additionalProperties = Object.assign({}, contents[start]?.additionalProperties);
    return newTextContent;
  });

  coalesce<TextReasoningContent>(contents, TextReasoningContent, false, (contents, start, end) => {
    const newTextReasoningContent = new TextReasoningContent(mergeText(contents, start, end));
    newTextReasoningContent.additionalProperties = Object.assign({}, contents[start]?.additionalProperties);
    return newTextReasoningContent;
  });

  function mergeText(contents: (AIContent | undefined)[], start: number, end: number): string {
    let sb = '';
    for (let i = start; i < end; i++) {
      sb += contents[i]?.toString() ?? '';
    }
    return sb;
  }

  function coalesce<TContent extends AIContent>(
    contents: (AIContent | undefined)[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctor: new (...args: any[]) => TContent,
    mergeSingle: boolean,
    merge: (contents: (AIContent | undefined)[], start: number, end: number) => TContent
  ): void {
    let start = 0;
    while (start < contents.length) {
      const firstContent = tryAsCoalescable(contents[start], ctor);
      if (!firstContent) {
        start++;
        continue;
      }

      let i = start + 1;
      while (i < contents.length && tryAsCoalescable(contents[i], ctor)) {
        i++;
      }

      if (start === i - 1 && !mergeSingle) {
        start++;
        continue;
      }

      contents[start] = merge(contents, start, i);

      start++;
      while (start < i) {
        contents[start++] = undefined;
      }
    }

    // Remove nulls in-place
    let nextSlot = 0;
    for (let i = 0; i < contents.length; i++) {
      if (contents[i] != null) {
        contents[nextSlot++] = contents[i];
      }
    }
    contents.length = nextSlot;
  }

  function tryAsCoalescable<T extends AIContent>(
    content: AIContent | undefined,
    ctor: new (...args: unknown[]) => T
  ): T | undefined {
    if (content && content instanceof ctor && (!content.annotations || content.annotations.length === 0)) {
      return content;
    }
    return undefined;
  }
}
