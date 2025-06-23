import { renderHook } from '@testing-library/react';
import { useChat, UseChatProps } from './useChat';

describe('useChat', () => {
  it('should be able to send a message', () => {
    // Arrange
    const props: UseChatProps = {};

    // Act
    const result = renderHook(() => useChat(props));

    // Assert
    expect(result.result.current).toBeDefined();
  });
});
