import { type AIContent } from '../AIContent';
import { FunctionCallContent } from '../FunctionCallContent';
import { FunctionResultContent } from '../FunctionResultContent';
import { TextContent } from '../TextContent';

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
