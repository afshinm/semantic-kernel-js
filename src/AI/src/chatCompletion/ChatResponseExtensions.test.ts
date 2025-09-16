import { TextContent } from '../contents/TextContent';
import { toChatResponse } from './ChatResponseExtensions';
import { ChatResponseUpdate } from './ChatResponseUpdate';

describe('ChatResponseExtensions', () => {
  describe('toChatResponse', () => {
    it('should convert ChatResponseUpdate array to ChatResponse correctly', () => {
      // Arrange
      const update1 = new ChatResponseUpdate();
      update1.messageId = 'msg1';
      update1.role = 'user';
      update1.contents = [new TextContent('Hello')];
      update1.authorName = 'User1';
      update1.createdAt = 1620000000;

      const update2 = new ChatResponseUpdate();
      update2.messageId = 'msg1';
      update2.contents = [new TextContent(' How are you?')];
      update2.finishReason = undefined;
      update2.role = undefined;
      update2.authorName = undefined;
      update2.createdAt = undefined;

      const update3 = new ChatResponseUpdate();
      update3.messageId = 'msg2';
      update3.role = 'assistant';
      update3.contents = [new TextContent("I'm fine, thank you!")];

      const updates: ChatResponseUpdate[] = [update1, update2, update3];

      // Act
      const chatResponse = toChatResponse(updates);

      // Assert
      expect(chatResponse.messages.length).toBe(2);

      expect(chatResponse.messages[0].role).toBe('user');
      expect(chatResponse.messages[0].authorName).toBe('User1');
      expect(chatResponse.messages[0].createdAt).toBe(1620000000);
      expect(chatResponse.messages[0].text).toBe('Hello How are you?');

      expect(chatResponse.messages[1].role).toBe('assistant');
      expect(chatResponse.messages[1].authorName).toBe(undefined);
      expect(chatResponse.messages[1].createdAt).toBe(undefined);
      expect(chatResponse.messages[1].text).toBe("I'm fine, thank you!");
    });
  });
});
