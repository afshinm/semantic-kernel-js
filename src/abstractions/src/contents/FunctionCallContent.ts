import { AIContent } from './AIContent';

export class FunctionCallContent extends AIContent {
  callId: string;
  name: string;
  arguments?: Record<string, unknown>;
  exception?: Error;

  constructor(params: { callId: string; name: string; arguments?: Record<string, unknown> }) {
    super();
    this.callId = params.callId;
    this.name = params.name;
    this.arguments = params.arguments;
  }
}
