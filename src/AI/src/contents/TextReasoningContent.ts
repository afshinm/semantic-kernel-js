import { AIContent } from './AIContent';

/**
 * Represents text reasoning content in a chat.
 * `TextReasoningContent` is distinct from `TextContent`. `TextReasoningContent`
 * represents "thinking" or "reasoning" performed by the model and is distinct from the actual output text from
 * the model, which is represented by `TextContent`. Neither types derives from the other.
 */
export class TextReasoningContent extends AIContent {
  private _text?: string;

  constructor(text?: string) {
    super();
    this._text = text;
  }

  get text(): string {
    return this._text ?? '';
  }

  set text(value: string) {
    this._text = value;
  }

  override toString(): string {
    return this.text;
  }
}
