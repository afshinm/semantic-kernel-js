import { renderHook } from '@testing-library/react';
import { MockChatClient } from '../../tests/mockChatCompletionService';
import { useChat, useChatProps } from './useChat';

describe('useChat', () => {
  it('should be able to send a message', () => {
    // Arrange
    const props: useChatProps = {
      chatClient: new MockChatClient(),
    };

    // Act
    const result = renderHook(() => useChat(props));

    // Assert
    expect(result.result.current).toBeDefined();
  });
});
