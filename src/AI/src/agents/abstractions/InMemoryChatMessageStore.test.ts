import { ChatMessage } from '../../contents/ChatMessage';
import { InMemoryChatMessageStore } from './InMemoryChatMessageStore';

describe('InMemoryChatMessageStore', () => {
  it('should add messages', async () => {
    // Arrange
    const store = new InMemoryChatMessageStore();
    const messages: ChatMessage[] = [
      new ChatMessage({ role: 'system', content: 'Hello' }),
      new ChatMessage({ role: 'user', content: 'World' }),
    ];

    // Act
    await store.addMessages(messages);

    // Assert
    expect(store.count).toBe(2);
    expect((await store.getMessages())[0].text).toBe('Hello');
    expect((await store.getMessages())[0].role).toBe('system');
    expect((await store.getMessages())[1].text).toBe('World');
    expect((await store.getMessages())[1].role).toBe('user');
  });

  it('add empty messages', async () => {
    // Arrange
    const store = new InMemoryChatMessageStore();

    // Act
    await store.addMessages([]);

    // Assert
    expect(store.count).toBe(0);
    expect(await store.getMessages()).toEqual([]);
  });
});
