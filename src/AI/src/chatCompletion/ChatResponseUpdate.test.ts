import { TextContent } from '../contents/TextContent';
import { ChatResponseUpdate } from './ChatResponseUpdate';

describe('ChatResponseUpdate', () => {
  describe('fromJSON', () => {
    it('should create a ChatResponseUpdate instance from JSON', () => {
      // Arrange
      const stubChatResponseUpdate = new ChatResponseUpdate();
      stubChatResponseUpdate.messageId = 'msg1';
      stubChatResponseUpdate.role = 'user';
      stubChatResponseUpdate.contents = [new TextContent('Hello')];
      stubChatResponseUpdate.authorName = 'User1';
      stubChatResponseUpdate.createdAt = 1620000000;
      stubChatResponseUpdate.finishReason = 'stop';

      // Act
      const chatResponseUpdate = ChatResponseUpdate.fromJSON(JSON.stringify(stubChatResponseUpdate));

      // Assert
      expect(chatResponseUpdate).toBeInstanceOf(ChatResponseUpdate);
      expect(chatResponseUpdate.messageId).toBe('msg1');
      expect(chatResponseUpdate.role).toBe('user');
      expect(chatResponseUpdate.contents.length).toBe(1);
      expect(chatResponseUpdate.contents[0]).toBeInstanceOf(TextContent);
      expect((chatResponseUpdate.contents[0] as TextContent).text).toBe('Hello');
      expect(chatResponseUpdate.authorName).toBe('User1');
      expect(chatResponseUpdate.createdAt).toBe(1620000000);
      expect(chatResponseUpdate.finishReason).toBe('stop');
    });
  });
});
