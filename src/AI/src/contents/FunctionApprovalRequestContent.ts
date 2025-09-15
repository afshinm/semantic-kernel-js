import { FunctionApprovalResponseContent } from './FunctionApprovalResponseContent';
import { FunctionCallContent } from './FunctionCallContent';
import { UserInputRequestContent } from './UserInputRequestContent';

export class FunctionApprovalRequestContent extends UserInputRequestContent {
  private _functionCallContent: FunctionCallContent;

  constructor(id: string, functionCallContent: FunctionCallContent) {
    super(id);
    this._functionCallContent = functionCallContent;
  }

  public get functionCallContent(): FunctionCallContent {
    return this._functionCallContent;
  }

  createResponse(approved: boolean): FunctionApprovalResponseContent {
    return new FunctionApprovalResponseContent(this.id, approved, this._functionCallContent);
  }
}
