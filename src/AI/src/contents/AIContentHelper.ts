import { type AIContent } from './AIContent';
import { ChatMessage } from './ChatMessage';
import { FunctionCallContent } from './FunctionCallContent';
import { FunctionResultContent } from './FunctionResultContent';
import { TextContent } from './TextContent';

/**
 * Concatenates the text content of an array of AIContent or ChatMessage objects.
 * @param contents An array of AIContent or ChatMessage objects to concatenate.
 * @returns A string containing the concatenated text from all provided contents.
 */
export function concatText(contents: (AIContent | ChatMessage)[]): string {
  const count = contents.length;

  switch (count) {
    case 0:
      return '';

    case 1: {
      const current = contents[0];
      if (current instanceof ChatMessage) {
        return current.text;
      } else {
        return (current as TextContent)?.text || '';
      }
    }

    default: {
      let builder = '';
      for (let i = 0; i < count; i++) {
        const current = contents[i];

        if (current instanceof ChatMessage) {
          builder += current.text;
        } else {
          builder += (current as TextContent)?.text || '';
        }
      }
      return builder;
    }
  }
}

/**
 * Creates an instance of AIContent based on the provided content object.
 * @param content An object representing the content to create, which can be of type AIContent, TextContent, FunctionCallContent, or FunctionResultContent.
 * @returns An instance of AIContent or its derived type based on the provided content.
 */
export function createAIContentFromJSON(
  content: AIContent
): TextContent | FunctionCallContent | FunctionResultContent | AIContent {
  switch (content.type) {
    case TextContent.name:
      return Object.assign(new TextContent(), content);
    case FunctionCallContent.name:
      return Object.assign(new FunctionCallContent(content as FunctionCallContent), content);
    case FunctionResultContent.name:
      return Object.assign(new FunctionResultContent(content as FunctionResultContent), content);
    default:
      // If the type is not recognized, default to AIContent
      return Object.assign({}, content);
  }
}
