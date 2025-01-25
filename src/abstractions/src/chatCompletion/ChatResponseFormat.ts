import { ChatResponseFormatJson } from './ChatResponseFormatJson';
import { ChatResponseFormatText } from './ChatResponseFormatText';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ChatResponseFormat {
  protected constructor() {}

  static Text = new ChatResponseFormatText();
  static Json = new ChatResponseFormatJson({});
}
