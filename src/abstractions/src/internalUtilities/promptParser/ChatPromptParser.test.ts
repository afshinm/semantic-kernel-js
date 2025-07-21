import { TextContent } from '@semantic-kernel/ai';
import { ChatPromptParser } from './ChatPromptParser';

describe('ChatPromptParser', () => {
  it('should parse a valid chat prompt with multiple messages', () => {
    // Arrange
    const prompt = `<message role="user"><TEXT>Hello</TEXT></message><message role="assistant"><TEXT>Hi there!</TEXT></message>`;

    // Act
    const result = ChatPromptParser.tryParse(prompt);

    // Assert
    expect(result).toBeDefined();
    expect(result?.length).toBe(2);
    expect(result?.[0].role).toBe('user');
    expect((result?.[0].contents)).toHaveLength(1);
    expect((result?.[0].contents[0] as TextContent).text).toBe('Hello');
    expect(result?.[1].role).toBe('assistant');
    expect((result?.[1].contents[0] as TextContent).text).toBe('Hi there!');
  });

  it('should parse a valid chat prompt with a single message', () => {
    // Arrange
    const prompt = `<message role="user">Hello</message>`;

    // Act
    const result = ChatPromptParser.tryParse(prompt);

    // Assert
    expect(result).toBeDefined();
    expect(result?.length).toBe(1);
    expect(result?.[0].role).toBe('user');
    expect((result?.[0].contents)).toHaveLength(1);
    expect((result?.[0].contents[0] as TextContent).text).toBe('Hello');
  });

  it('should parse a valid chat prompt with a single text message', () => {
    // Arrange
    const prompt = `<message role="user"><TEXT>Hello</TEXT></message>`;

    // Act
    const result = ChatPromptParser.tryParse(prompt);

    // Assert
    expect(result).toBeDefined();
    expect(result?.length).toBe(1);
    expect(result?.[0].role).toBe('user');
    expect((result?.[0].contents)).toHaveLength(1);
    expect((result?.[0].contents[0] as TextContent).text).toBe('Hello');
  });

  it('should return undefined for an invalid chat prompt', () => {
    // Arrange
    const invalidPrompt = `message role="user">Hello`;

    // Act
    const result = ChatPromptParser.tryParse(invalidPrompt);

    // Assert
    expect(result).toBeUndefined();
  });
});
