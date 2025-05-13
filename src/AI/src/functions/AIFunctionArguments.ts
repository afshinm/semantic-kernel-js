import { FromSchema, JsonSchema } from '@semantic-kernel/ai';

/**
 * Represents the arguments for an AI function.
 */
export class AIFunctionArguments<Schema extends JsonSchema = false, Args = FromSchema<Schema>> {
  private _arguments: Args;

  public constructor(args?: Args) {
    this._arguments = args || (undefined as Args);
  }

  /**
   * Get the arguments for the kernel function.
   */
  public get arguments(): Args {
    return this._arguments;
  }

  /**
   * Set the arguments for the kernel function.
   */
  public set arguments(args: Args) {
    this._arguments = args;
  }
}
