import { PromptExecutionSettings, defaultServiceId } from '../AI';
import { Kernel } from '../Kernel';
import { FunctionName } from './FunctionName';
import { AIFunctionFactory, AIFunctionMetadata, AIFunctionParameterMetadata, FromSchema } from '@semantic-kernel/ai';

// export type Fn<Result, Args> = (args: Args, kernel?: Kernel) => Result;
//
// export type FunctionResult<
//   Schema extends JsonSchema | unknown | undefined = unknown,
//   Result = unknown,
//   Args = Schema extends JsonSchema
//     ? FromSchema<Schema>
//     : Schema extends undefined
//       ? undefined
//       : Record<string, unknown>,
// > = {
//   function?: KernelFunction<Schema, Result, Args>;
//   value?: Result;
//   renderedPrompt?: string;
//   metadata?: ReadonlyMap<string, unknown>;
// };

export class KernelFunctionMetadata<PARAMETERS = AIFunctionParameterMetadata> extends AIFunctionMetadata<PARAMETERS> {
  pluginName?: string;
  executionSettings?: Map<string, PromptExecutionSettings>;
}

export abstract class KernelFunction<
  PARAMETERS extends AIFunctionParameterMetadata = AIFunctionParameterMetadata,
  SCHEMA = FromSchema<PARAMETERS>,
> {
  private _metadata: KernelFunctionMetadata<PARAMETERS>;

  constructor(metadata: KernelFunctionMetadata<PARAMETERS>) {
    this._metadata = metadata;
  }

  get metadata(): KernelFunctionMetadata<PARAMETERS> {
    return {
      ...this._metadata,
      name: FunctionName.fullyQualifiedName({
        functionName: this._metadata.name,
        pluginName: this._metadata.pluginName,
      }),
    };
  }

  set metadata(metadata: KernelFunctionMetadata<PARAMETERS>) {
    this._metadata = metadata;
  }

  get executionSettings(): Map<string, PromptExecutionSettings> | undefined {
    return this.metadata.executionSettings;
  }

  set executionSettings(
    settings: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings
  ) {
    if (Array.isArray(settings)) {
      const newExecutionSettings = new Map<string, PromptExecutionSettings>();

      for (const _settings of settings) {
        const targetServiceId = _settings.serviceId ?? defaultServiceId;

        if (this._metadata.executionSettings?.has(targetServiceId)) {
          throw new Error(`Execution settings for service ID ${targetServiceId} already exists.`);
        }

        newExecutionSettings.set(targetServiceId, _settings);
      }

      this._metadata.executionSettings = newExecutionSettings;
    } else if (settings instanceof Map) {
      this._metadata.executionSettings = settings;
    } else {
      this._metadata.executionSettings = new Map([[settings.serviceId ?? defaultServiceId, settings]]);
    }
  }

  protected abstract invokeCore(kernel: Kernel, args?: SCHEMA): Promise<unknown>;

  protected abstract invokeStreamingCore(kernel: Kernel, args?: SCHEMA): AsyncGenerator<unknown>;

  async invoke(kernel: Kernel, args?: SCHEMA): Promise<unknown> {
    return this.invokeCore(kernel, args);
  }

  async *invokeStreaming(kernel: Kernel, args?: SCHEMA): AsyncGenerator<unknown> {
    const enumerable = this.invokeStreamingCore(kernel, args);

    for await (const value of enumerable) {
      yield value;
    }
  }

  asAIFunction(kernel?: Kernel) {
    return AIFunctionFactory.create((args: SCHEMA) => this.invoke(kernel ?? new Kernel(), args), this.metadata);
  }
}

export const kernelFunction = <
  PARAMETERS extends AIFunctionParameterMetadata = AIFunctionParameterMetadata,
  SCHEMA = FromSchema<PARAMETERS>,
>(
  fn: (args?: SCHEMA, kernel?: Kernel) => unknown,
  metadata: KernelFunctionMetadata<PARAMETERS>
): KernelFunction<PARAMETERS, SCHEMA> => {
  return new (class extends KernelFunction<PARAMETERS, SCHEMA> {
    public constructor() {
      super(metadata);
    }

    protected override invokeStreamingCore(): AsyncGenerator<unknown> {
      throw new Error('Method not implemented.');
    }

    override async invokeCore(kernel: Kernel, args?: SCHEMA) {
      return await fn(args, kernel);
    }
  })();
};
