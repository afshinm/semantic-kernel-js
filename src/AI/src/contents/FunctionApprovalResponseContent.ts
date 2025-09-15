import { FunctionCallContent } from './FunctionCallContent';
import { UserInputResponseContent } from './UserInputResponseContent';

export class FunctionApprovalResponseContent extends UserInputResponseContent {
  private _approved: boolean;
  private _functionCall: FunctionCallContent;

  constructor(id: string, approved: boolean, functionCall: FunctionCallContent) {
    super(id);
    this._functionCall = functionCall;
    this._approved = approved;
  }

  public get approved(): boolean {
    return this._approved;
  }

  public get functionCall(): FunctionCallContent {
    return this._functionCall;
  }
}
