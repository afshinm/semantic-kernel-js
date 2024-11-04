import { PromptExecutionSettings, defaultServiceId } from '../AI';
import { FromSchema, JsonSchema } from '../jsonSchema';

/**
 * Represents the arguments for a kernel function.
 */
export class KernelArguments<
  Schema extends JsonSchema | unknown = unknown,
  Args = Schema extends JsonSchema ? FromSchema<Schema> : Record<string, unknown>,
> {
  private _arguments?: Args;
  private _executionSettings?: Map<string, PromptExecutionSettings>;

  public constructor({
    arguments: args,
    executionSettings,
  }: {
    arguments?: Args;
    executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
  }) {
    this._arguments = args;

    if (executionSettings) {
      if (Array.isArray(executionSettings)) {
        const newExecutionSettings = new Map<string, PromptExecutionSettings>();

        for (const settings of executionSettings) {
          const targetServiceId = settings.serviceId ?? defaultServiceId;

          if (this.executionSettings?.has(targetServiceId)) {
            throw new Error(`Execution settings for service ID ${targetServiceId} already exists.`);
          }

          newExecutionSettings.set(targetServiceId, settings);
        }

        this.executionSettings = newExecutionSettings;
      } else {
        this.executionSettings = executionSettings;
      }
    }
  }

  /**
   * Get the arguments for the kernel function.
   */
  public get arguments(): Args | undefined {
    return this._arguments;
  }

  /**
   * Set the arguments for the kernel function.
   */
  public set arguments(args: Args | undefined) {
    this._arguments = args;
  }

  /**
   * Get the execution settings for the kernel function.
   */
  public get executionSettings(): Map<string, PromptExecutionSettings> | undefined {
    return this._executionSettings;
  }

  /**
   * Set the execution settings for the kernel function.
   */
  public set executionSettings(settings: PromptExecutionSettings | Map<string, PromptExecutionSettings>) {
    if (settings instanceof Map) {
      if (settings.size > 0) {
        for (const [key, setting] of settings.entries()) {
          if (setting.serviceId && key !== setting.serviceId) {
            throw new Error(`Service ID ${setting.serviceId} must match the key ${key}.`);
          }
        }
      }

      this._executionSettings = settings;
    } else {
      this._executionSettings = new Map([[defaultServiceId, settings]]);
    }
  }
}
