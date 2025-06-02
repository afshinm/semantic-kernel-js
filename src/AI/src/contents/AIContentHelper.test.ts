import { concatText } from './AIContentHelper';
import { ChatMessage } from './ChatMessage';
import { TextContent } from './TextContent';

describe('AIContentHelper', () => {
  it('should concatenate text from AIContent array', () => {
    // Arrange
    const text1 = new TextContent('Hello');
    const text2 = new TextContent('World');
    const chatMessage1 = new ChatMessage({ role: 'user', content: 'This is a message.' });
    const chatMessage2 = new ChatMessage({ role: 'assistant', content: 'This is a response.' });

    const contents = [text1, text2, chatMessage1, chatMessage2];

    // Act
    const result = concatText(contents);

    // Assert
    expect(result).toBe('HelloWorldThis is a message.This is a response.');
  });

  it('should return empty string for empty array', () => {
    // Arrange
    const contents: ChatMessage[] = [];

    // Act
    const result = concatText(contents);

    // Assert
    expect(result).toBe('');
  });
});
