import { type PromptRenderContext } from './PromptRenderContext';

export type PromptRenderFilter = (
  context: PromptRenderContext,
  next: (context: PromptRenderContext) => Promise<void>
) => Promise<void>;
