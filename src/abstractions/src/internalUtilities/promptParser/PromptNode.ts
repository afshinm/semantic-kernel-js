/**
 * Class that contains information about node in prompt.
 */
export class PromptNode {
  private _attributes: Record<string, string> = {};
  private _childNodes: PromptNode[] = [];
  private _tagName: string;
  private _content?: string;

  constructor(tagName: string) {
    this._tagName = tagName;
  }

  get tagName(): string {
    return this._tagName;
  }

  set tagName(value: string) {
    this._tagName = value;
  }

  get attributes(): Record<string, string> {
    return this._attributes;
  }

  set attributes(value: Record<string, string>) {
    this._attributes = value;
  }

  get childNodes(): PromptNode[] {
    return this._childNodes;
  }

  set childNodes(value: PromptNode[]) {
    this._childNodes = value;
  }

  get content(): string | undefined {
    return this._content;
  }

  set content(value: string | undefined) {
    this._content = value;
  }
}
