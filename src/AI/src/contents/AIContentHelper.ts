import { AIContent } from './AIContent';
import { ChatMessage } from './ChatMessage';
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
