import { Kernel } from '../../Kernel';
import { ChatMessageContent, StreamingChatMessageContent } from '../../contents';
import { AIService } from '../../services/AIService';
import { PromptExecutionSettings } from '../promptExecutionSettings/PromptExecutionSettings';
import { ChatHistory } from './ChatHistory';

/**
 * Interface for chat completion services.
 */
export interface ChatCompletionService extends AIService {
  /**
   * Get chat multiple chat content choices for the prompt and settings.
   */
  getChatMessageContents(params: {
    prompt?: string;
    chatHistory?: ChatHistory;
    executionSettings?: PromptExecutionSettings;
    kernel?: Kernel;
  }): Promise<ChatMessageContent[]>;

  /**
   * Get streaming chat contents for the chat history provided using the specified settings.
   */
  getStreamingChatMessageContents(params: {
    prompt?: string;
    chatHistory?: ChatHistory;
    executionSettings?: PromptExecutionSettings;
    kernel?: Kernel;
  }): AsyncGenerator<StreamingChatMessageContent>;
}
