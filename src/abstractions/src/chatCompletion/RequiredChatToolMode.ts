import { ChatToolModeBase } from './ChatToolModeBase';

export class RequiredChatToolMode extends ChatToolModeBase {
  requiredFunctionName?: string;

  constructor(requiredFunctionName: string | undefined) {
    super();

    if (requiredFunctionName) {
      this.requiredFunctionName = requiredFunctionName;
    }
  }
}
