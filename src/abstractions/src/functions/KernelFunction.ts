import { AIFunctionFactory, type DefaultJsonSchema, type FromSchema, type JsonSchema } from '@semantic-kernel/ai';
import { defaultServiceId } from '@semantic-kernel/service-provider';
import { type Kernel } from '../Kernel';
import { type PromptExecutionSettings } from '../promptExecutionSettings';
import { FunctionName } from './FunctionName';
import { type FunctionResult } from './FunctionResult';
import { KernelArguments } from './KernelArguments';

export class KernelFunctionMetadata<Schema extends JsonSchema = typeof DefaultJsonSchema> {
  name: string = '';
  description?: string;
  schema?: Schema;
  pluginName?: string;
  executionSettings?: Map<string, PromptExecutionSettings>;
}

export abstract class KernelFunction<
  ReturnType = unknown,
  Schema extends JsonSchema = typeof DefaultJsonSchema,
  Args = FromSchema<Schema>,
> {
  private _metadata: KernelFunctionMetadata<Schema>;

  constructor(metadata: KernelFunctionMetadata<Schema>) {
    this._metadata = metadata;
  }

  get metadata(): KernelFunctionMetadata<Schema> {
    return this._metadata;
  }

  set metadata(metadata: KernelFunctionMetadata<Schema>) {
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

  protected abstract invokeCore(
    kernel: Kernel,
    args: KernelArguments<Schema, Args>
  ): Promise<FunctionResult<ReturnType, Schema, Args>>;

  protected abstract invokeStreamingCore<T>(kernel: Kernel, args: KernelArguments<Schema, Args>): AsyncGenerator<T>;

  async invoke(
    kernel: Kernel,
    args?: KernelArguments<Schema, Args>
  ): Promise<FunctionResult<ReturnType, Schema, Args>> {
    return this.invokeCore(kernel, args ?? new KernelArguments());
  }

  async *invokeStreaming<T>(kernel: Kernel, args?: KernelArguments<Schema, Args>): AsyncGenerator<T> {
    const enumerable = this.invokeStreamingCore<T>(kernel, args ?? new KernelArguments());

    for await (const value of enumerable) {
      yield value;
    }
  }

  asAIFunction(kernel: Kernel) {
    return AIFunctionFactory.create(
      async (args: Args) =>
        (await this.invoke(kernel, new KernelArguments(args, this.metadata.executionSettings))).value,
      {
        ...this.metadata,
        name: FunctionName.fullyQualifiedName({
          functionName: this.metadata.name,
          pluginName: this.metadata.pluginName,
        }),
      }
    );
  }
}

export const kernelFunction = <
  ReturnType = unknown,
  Schema extends JsonSchema = typeof DefaultJsonSchema,
  Args = FromSchema<Schema>,
>(
  fn: (args: Args, kernel?: Kernel) => ReturnType,
  metadata: KernelFunctionMetadata<Schema>
): KernelFunction<ReturnType, Schema, Args> => {
  return new (class extends KernelFunction<ReturnType, Schema, Args> {
    public constructor() {
      super(metadata);
    }

    protected override invokeStreamingCore<T>(): AsyncGenerator<T> {
      throw new Error('Method not implemented.');
    }

    override async invokeCore(
      kernel: Kernel,
      args: KernelArguments<Schema, Args>
    ): Promise<FunctionResult<ReturnType, Schema, Args>> {
      const value = await fn(args.arguments, kernel);

      return {
        function: this,
        value,
      };
    }
  })();
};
