import { AIContent } from './AIContent';

export class TextContent extends AIContent {
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
