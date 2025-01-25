import { AIContent } from './AIContent';

export class FunctionResultContent extends AIContent {
  callId: string;
  name: string;
  result: unknown;
  exception?: Error;

  constructor({ callId, name, result }: { callId: string; name: string; result: unknown }) {
    super();
    this.callId = callId;
    this.name = name;
    this.result = result;
  }
}
