import { renderHook } from '@testing-library/react';
import { MockChatCompletionService } from '../../tests/mockChatCompletionService';
import { useKernel, useKernelProps } from './useKernel';

describe('useKernel', () => {
  it('should create the kernel', () => {
    // Arrange
    const props: useKernelProps = {
      chatCompletionService: new MockChatCompletionService(),
    };

    // Act
    const result = renderHook(() => useKernel(props));

    // Assert
    expect(result.result).toBeDefined();
  });
});
