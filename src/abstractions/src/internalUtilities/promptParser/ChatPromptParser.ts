import { AIContent, ChatMessage, ChatRole, TextContent } from '@semantic-kernel/ai';
import { PromptNode } from './PromptNode';
import { XMLPromptParser } from './XMLPromptParser';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ChatPromptParser {
  public static readonly MessageTagName = 'message';
  public static readonly RoleAttributeName = 'role';
  private static readonly TextTagName = 'TEXT';

  static tryParse(prompt: string): ChatMessage[] | undefined {
    // Parse the input string into nodes and then those nodes into a chat history.
    // The XML parsing is expensive, so we do a quick up-front check to make sure
    // the text contains "<message", as that's required in any valid XML prompt.
    const messageTagStart = '<' + ChatPromptParser.MessageTagName;

    if (prompt && prompt.indexOf(messageTagStart) >= 0) {
      const nodes = XMLPromptParser.tryParse(prompt);
      const chatMessages: ChatMessage[] = [];

      for (const node of nodes ?? []) {
        if (ChatPromptParser.isValidChatMessage(node)) {
          const chatMessage = ChatPromptParser.parseChatNode(node);
          if (chatMessage) {
            chatMessages.push(chatMessage);
          }
        }
      }

      if (chatMessages.length === 0) {
        return undefined; // No valid chat messages found
      }

      return chatMessages;
    }
  }

  private static parseChatNode(node: PromptNode): ChatMessage {
    let items: AIContent[] = [];

    for (const childNode of node.childNodes) {
      if (!childNode.content) continue;

      const createBinaryContent = ChatPromptParser.contentFactoryMapping[childNode.tagName.toUpperCase()];
      if (createBinaryContent) {
        items.push(createBinaryContent(childNode.content));
      }
    }

    if (items.length === 1 && items[0] instanceof TextContent) {
      node.content = items[0].text; // If there's only one text content, use it as the message content
      items = []; // Clear items to avoid duplication
    }

    const role: ChatRole = node.attributes[ChatPromptParser.RoleAttributeName] as ChatRole;

    return items.length > 0
      ? new ChatMessage({ contents: items, role })
      : new ChatMessage({ content: node.content, role });
  }

  private static isValidChatMessage(node: PromptNode) {
    return (
      node.tagName === ChatPromptParser.MessageTagName &&
      node.attributes &&
      node.attributes[ChatPromptParser.RoleAttributeName]
    );
  }

  private static readonly contentFactoryMapping: Record<string, (content: string) => AIContent> = {
    [ChatPromptParser.TextTagName]: (content: string) => new TextContent(content),
    // TODO: handle other content types, e.g. IMAGE, AUDIO, etc.
  };
}
