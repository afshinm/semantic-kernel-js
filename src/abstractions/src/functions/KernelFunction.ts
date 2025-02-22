import { PromptExecutionSettings, defaultServiceId } from '../AI';
import { Kernel } from '../Kernel';
import { FromSchema } from '../jsonSchema';
import { AIFunction } from './AIFunction';
import { AIFunctionMetadata } from './AIFunctionMetadata';
import { AIFunctionParameterMetadata } from './AIFunctionParameterMetadata';
import { FunctionName } from './FunctionName';


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

export type KernelFunctionProps<Props> = Props;

export class KernelFunctionMetadata<PARAMETERS = AIFunctionParameterMetadata> extends AIFunctionMetadata<PARAMETERS> {
  pluginName?: string;
  executionSettings?: Map<string, PromptExecutionSettings>;
};

export abstract class KernelFunction<
  PARAMETERS extends AIFunctionParameterMetadata = AIFunctionParameterMetadata,
  SCHEMA = FromSchema<PARAMETERS>,
> extends AIFunction<PARAMETERS, SCHEMA> {
  private _metadata: KernelFunctionMetadata<PARAMETERS>;

  constructor(metadata: KernelFunctionMetadata<PARAMETERS>) {
    super();
    this._metadata = metadata;
  }

  override get metadata(): KernelFunctionMetadata<PARAMETERS> {
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

        if (this.metadata.executionSettings?.has(targetServiceId)) {
          throw new Error(`Execution settings for service ID ${targetServiceId} already exists.`);
        }

        newExecutionSettings.set(targetServiceId, _settings);
      }

      this.metadata.executionSettings = newExecutionSettings;
    } else if (settings instanceof Map) {
      this.metadata.executionSettings = settings;
    } else {
      this.metadata.executionSettings = new Map([[settings.serviceId ?? defaultServiceId, settings]]);
    }
  }

  protected abstract override invokeCore(args?: SCHEMA, kernel?: Kernel): Promise<unknown>;

  protected abstract invokeStreamingCore(args?: SCHEMA, kernel?: Kernel): AsyncGenerator<unknown>;

  override async invoke(args?: SCHEMA, kernel?: Kernel): Promise<unknown> {
    return this.invokeCore(args, kernel);
  }

  async *invokeStreaming(args?: SCHEMA, kernel?: Kernel): AsyncGenerator<unknown> {
    const enumerable = this.invokeStreamingCore(args, kernel);

    for await (const value of enumerable) {
      yield value;
    }
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

    override async invokeCore(
      args?: SCHEMA,
      kernel?: Kernel 
    ) {
      return await fn(args, kernel);
    }
  })();
};
