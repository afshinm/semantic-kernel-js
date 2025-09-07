export class AIAgentMetadata {
  private _providerName?: string;

  constructor(providerName?: string) {
    this._providerName = providerName;
  }

  get providerName(): string | undefined {
    return this._providerName;
  }
}
