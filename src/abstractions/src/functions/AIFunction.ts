import { AITool } from '../AITool';
import { AIFunctionMetadata } from './AIFunctionMetadata';

export abstract class AIFunction extends AITool {
  abstract metadata: AIFunctionMetadata;

  invokeAsync(args?: Record<string, unknown>) {
    args = args ?? {};
    return this.invokeCoreAsync(args);
  }

  protected abstract invokeCoreAsync(args: Record<string, unknown>): Promise<unknown>;
}
