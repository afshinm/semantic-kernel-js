import { XMLParser } from 'fast-xml-parser';
import { PromptNode } from './PromptNode';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class XMLPromptParser {
  static tryParse(prompt: string): PromptNode[] | undefined {
    if (!prompt || prompt.indexOf('<') < 0) {
      return undefined;
    }

    prompt = '<root>' + prompt + '</root>'; // Wrap in root to ensure valid XML

    try {
      const parser = new XMLParser({
        // This is necessary to preserve whitespace within prompts as this may be significant.
        // E.g. if the prompt contains well formatted code and we want the LLM to return well formatted code.
        trimValues: false,
        ignoreAttributes: false,
        cdataPropName: false,
      });
      const parsed = parser.parse(prompt);

      if (!parsed?.root) {
        return undefined;
      }

      const root = parsed?.root;

      for (const [tagName, node] of Object.entries(root)) {
        if (node instanceof Array) {
          // If the node is an array, we assume it's a list of messages.
          return node.map((item) => XMLPromptParser.getPromptNode(tagName, item)).filter((item) => item !== undefined);
        } else if (typeof node === 'object') {
          // If the node is an object, we assume it's a single message.
          const promptNode = XMLPromptParser.getPromptNode(tagName, node);
          if (promptNode) {
            return [promptNode];
          }
        }
      }
    } catch {
      return undefined;
    }
  }

  private static getPromptNode(tagName: string, node: object | string | null): PromptNode | undefined {
    if (!node) {
      return undefined;
    }

    const promptNode = new PromptNode(tagName);

    if (typeof node === 'string') {
      // If the node is a string, we assume it's the content of the node.
      promptNode.content = decodeURIComponent(node);
      return promptNode;
    }

    for (const [key, value] of Object.entries(node)) {
      if (!key || !value) {
        continue; // Skip empty keys or values
      }

      if (key === '#text') {
        promptNode.content = decodeURIComponent(value);
      } else if (key.startsWith('@_')) {
        // parse attributes
        const attributeName = key.substring(2); // Remove the '@_' prefix
        if (typeof value === 'string') {
          promptNode.attributes[attributeName] = value;
        }
      } else {
        // parse child nodes

        if (value instanceof Array) {
          // If the value is an array, we assume it's a list of child nodes.
          promptNode.childNodes = [
            ...promptNode.childNodes,
            ...value.map((item) => XMLPromptParser.getPromptNode(key, item)).filter((item) => item !== undefined),
          ];
        } else {
          const childNode = XMLPromptParser.getPromptNode(key, value);
          if (childNode) {
            promptNode.childNodes.push(childNode);
          }
        }
      }
    }

    return promptNode;
  }
}
