import { AutoChatToolMode } from './AutoChatToolMode';
import { NoneChatToolMode } from './NoneChatToolMode';
import { RequiredChatToolMode } from './RequiredChatToolMode';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ChatToolMode {
  protected constructor() {}

  public static Auto = new AutoChatToolMode();

  public static None = new NoneChatToolMode();

  public static RequireAny = new RequiredChatToolMode(undefined);

  public static RequireSpecific(functionName: string) {
    return new RequiredChatToolMode(functionName);
  }
}
