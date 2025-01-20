import { FunctionCallContent, KernelContent } from '.';
import { Encoding, FunctionResultContent, TextContent } from '.';

/**
 * Represents chat message content return from a {@link ChatCompletionService} service.
 */
export class ChatMessageContent<Role = 'system' | 'author' | 'user' | 'assistant' | 'tool'> extends KernelContent {
  /**
   * Role of the author of the chat message.
   */
  role: Role;

  /**
   * Chat message content items.
   */
  items: Role extends 'system'
    ? Array<TextContent>
    : Role extends 'author'
      ? Array<TextContent>
      : Role extends 'user'
        ? Array<TextContent>
        : Role extends 'assistant'
          ? Array<TextContent | FunctionCallContent>
          : Role extends 'tool'
            ? Array<FunctionResultContent>
            : never;

  /**
   * The name of the author of the chat message.
   */
  authorName?: string;

  /**
   * The encoding of the chat message content.
   */
  // private _encoding?: Encoding;

  // get encoding(): Encoding | undefined {
  //   const textContents = this.items.filter((item) => item instanceof TextContent) as TextContent[];
  //   if (textContents.length > 0) {
  //     return textContents[0].encoding;
  //   }

  //   return this._encoding;
  // }

  // set encoding(value: Encoding) {
  //   this._encoding = value;

  //   const textContents = this.items.filter((item) => item instanceof TextContent) as TextContent[];

  //   if (textContents.length > 0) {
  //     textContents[0].encoding = value;
  //   }
  // }

  /**
   * A convenience property to get he text of the first item in the items.
   */
  get content() {
    if (this.items.length > 0 && this.items[0] instanceof TextContent) {
      return this.items[0].text;
    }
  }

  /**
   * Represents the source of the message. The source is corresponds to the entity that generated this message.
   * The property is intended to be used by agents to associate themselves with the messages they generate.
   */
  source?: object;

  constructor({
    role,
    items,
    authorName,
    // encoding,
    source,
    ...props
  }: {
    role: Role;
    items: ChatMessageContent<Role>['items'];
    authorName?: string;
    encoding?: Encoding;
    source?: object;
  } & KernelContent) {
    super(props);
    this.role = role;
    this.items = items;
    this.authorName = authorName;
    // this._encoding = encoding;
    this.source = source;
  }

  static isSystemMessage(message: ChatMessageContent): message is ChatMessageContent<'system'> {
    return message.role === 'system';
  }

  static isToolMessage(message: ChatMessageContent): message is ChatMessageContent<'tool'> {
    return message.role === 'tool';
  }

  static isUserMessage(message: ChatMessageContent): message is ChatMessageContent<'user'> {
    return message.role === 'user';
  }

  static isAssistantMessage(message: ChatMessageContent): message is ChatMessageContent<'assistant'> {
    return message.role === 'assistant';
  }
}
