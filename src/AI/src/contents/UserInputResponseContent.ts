import { AIContent } from './AIContent';

export class UserInputResponseContent extends AIContent {
  private _id: string;

  protected constructor(id: string) {
    super();
    this._id = id;
  }

  public get id(): string {
    return this._id;
  }
}
