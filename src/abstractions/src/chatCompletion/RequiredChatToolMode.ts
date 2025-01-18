import { ChatToolMode } from './ChatToolMode';

export class RequiredChatToolMode extends ChatToolMode {
  requiredFunctionName?: string;

  constructor(requiredFunctionName: string | undefined) {
    super();

    if (requiredFunctionName) {
      this.requiredFunctionName = requiredFunctionName;
    }
  }
}
