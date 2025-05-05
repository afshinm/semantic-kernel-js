import { renderHook } from '@testing-library/react';
import { MockChatClient } from '../../tests/mockChatCompletionService';
import { useKernel, useKernelProps } from './useKernel';

describe('useKernel', () => {
  it('should create the kernel', () => {
    // Arrange
    const props: useKernelProps = {
      chatClient: new MockChatClient(),
    };

    // Act
    const result = renderHook(() => useKernel(props));

    // Assert
    expect(result.result).toBeDefined();
  });
});
