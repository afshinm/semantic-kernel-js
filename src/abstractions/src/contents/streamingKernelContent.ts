import { InnerContent } from './innerContent';
import { ModelId } from './modelId';

/**
 * Represents a single update to a streaming content.
 */
export type StreamingKernelContent = {
  /**
   * In a scenario of multiple choices per request, this represents zero-based index of the choice in the streaming sequence
   */
  choiceIndex: number;

  /**
   * The inner content representation. Use this to bypass the current abstraction.
   * The usage of this property is considered "unsafe". Use it only if strictly necessary.
   */
  innerContent: InnerContent;

  /**
   * The model id used to generate the content.
   */
  modelId: ModelId;

  /**
   * Metadata associated with the content.
   */
  metadata: Map<string, object>;
};