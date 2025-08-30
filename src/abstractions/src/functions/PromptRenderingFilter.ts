import { PromptRenderingContext } from './PromptRenderingContext';

export type PromptRenderingFilter = (
  context: PromptRenderingContext,
  next: (context: PromptRenderingContext) => Promise<void>
) => Promise<void>;
