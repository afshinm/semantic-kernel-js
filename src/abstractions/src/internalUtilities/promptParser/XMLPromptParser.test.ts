import { XMLPromptParser } from './XMLPromptParser';

describe('XMLPromptParser', () => {
  it('should parse a XML prompt with multiple messages', () => {
    // Arrange
    const xmlPrompt = `<message role="user">Hello</message><message role="assistant">Hi there!</message>`;

    // Act
    const result = XMLPromptParser.tryParse(xmlPrompt);

    // Assert
    expect(result).toBeDefined();
    expect(result?.length).toBe(2);
    expect(result?.[0].tagName).toBe('message');
    expect(result?.[0].attributes.role).toBe('user');
    expect(result?.[0].content).toBe('Hello');
    expect(result?.[1].tagName).toBe('message');
    expect(result?.[1].attributes.role).toBe('assistant');
    expect(result?.[1].content).toBe('Hi there!');
  });

  it('should parse a XML prompt with a single message', () => {
    // Arrange
    const xmlPrompt = `<message role="user">Hello</message>`;

    // Act
    const result = XMLPromptParser.tryParse(xmlPrompt);

    // Assert
    expect(result).toBeDefined();
    expect(result?.length).toBe(1);
    expect(result?.[0].tagName).toBe('message');
    expect(result?.[0].attributes.role).toBe('user');
    expect(result?.[0].content).toBe('Hello');
  });

  it('should parse nested XML prompts', () => {
    // Arrange
    const xmlPrompt = `<message role="user"><TEXT>Hello</TEXT></message><message role="assistant"><TEXT>Hi there!</TEXT></message>`;

    // Act
    const result = XMLPromptParser.tryParse(xmlPrompt);

    // Assert
    expect(result).toBeDefined();
    expect(result?.length).toBe(2);
    expect(result?.[0].tagName).toBe('message');
    expect(result?.[0].attributes.role).toBe('user');
    expect(result?.[0].childNodes.length).toBe(1);
    expect(result?.[0].childNodes[0].tagName).toBe('TEXT');
    expect(result?.[0].childNodes[0].content).toBe('Hello');
    expect(result?.[1].tagName).toBe('message');
    expect(result?.[1].attributes.role).toBe('assistant');
    expect(result?.[1].childNodes.length).toBe(1);
    expect(result?.[1].childNodes[0].tagName).toBe('TEXT');
    expect(result?.[1].childNodes[0].content).toBe('Hi there!');
  });

  it('should return undefined for an invalid XML prompt', () => {
    // Arrange
    const invalidXmlPrompt = `message role="user">Hello`;

    // Act
    const result = XMLPromptParser.tryParse(invalidXmlPrompt);

    // Assert
    expect(result).toBeUndefined();
  });
});
