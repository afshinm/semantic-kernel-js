import { htmlEscape } from './htmlEscape';

describe('htmlEscape', () => {
  it('should escape HTML tags', () => {
    // Arrange
    const input = '<div>Hello & "world"</div>';
    const expected = '&lt;div&gt;Hello &amp; &quot;world&quot;&lt;/div&gt;';

    // Act
    const result = htmlEscape(input);

    // Assert
    expect(result).toBe(expected);
  });
});
