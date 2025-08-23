import { AIFunctionFactory, type DefaultJsonSchema, type FromSchema, type JsonSchema } from '@semantic-kernel/ai';
import { defaultServiceId } from '@semantic-kernel/common';
import { type Kernel } from '../Kernel';
import { type PromptExecutionSettings } from '../promptExecutionSettings';
import { FunctionName } from './FunctionName';
import { type FunctionResult } from './FunctionResult';
import { KernelArguments } from './KernelArguments';

export type KernelFunctionMetadata<Schema extends JsonSchema = typeof DefaultJsonSchema> = {
  name: string;
  description?: string;
  schema?: Schema;
  pluginName?: string;
  executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
};

export abstract class KernelFunction<
  ReturnType = unknown,
  Schema extends JsonSchema = typeof DefaultJsonSchema,
  Args = FromSchema<Schema>,
> {
  private _metadata: KernelFunctionMetadata<Schema>;
  private _executionSettings?: Map<string, PromptExecutionSettings>;

  constructor(metadata: KernelFunctionMetadata<Schema>) {
    this._metadata = metadata;
    if (metadata.executionSettings) {
      this.executionSettings = metadata.executionSettings;
    }
  }

  get metadata(): KernelFunctionMetadata<Schema> {
    return this._metadata;
  }

  set metadata(metadata: KernelFunctionMetadata<Schema>) {
    this._metadata = metadata;
  }

  get executionSettings(): Map<string, PromptExecutionSettings> | undefined {
    return this._executionSettings;
  }

  set executionSettings(
    settings: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings
  ) {
    if (Array.isArray(settings)) {
      const newExecutionSettings = new Map<string, PromptExecutionSettings>();

      for (const _settings of settings) {
        const targetServiceId = _settings.serviceId ?? defaultServiceId;

        if (this._executionSettings?.has(targetServiceId)) {
          throw new Error(`Execution settings for service ID ${targetServiceId} already exists.`);
        }

        newExecutionSettings.set(targetServiceId, _settings);
      }

      this._executionSettings = newExecutionSettings;
    } else if (settings instanceof Map) {
      this._executionSettings = settings;
    } else {
      this._executionSettings = new Map([[settings.serviceId ?? defaultServiceId, settings]]);
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
    let functionResult: FunctionResult<ReturnType, Schema, Args> = { function: this };

    const invocationContext = await kernel.onFunctionInvocation({
      arguments: args,
      function: this,
      functionResult,
      isStreaming: false,
      functionCallback: async (context) => {
        context.result = await this.invokeCore(kernel, args ?? new KernelArguments());
      },
    });

    functionResult = invocationContext.result;

    return functionResult;
  }

  async *invokeStreaming<T>(kernel: Kernel, args?: KernelArguments<Schema, Args>): AsyncGenerator<T> {
    args = args ?? new KernelArguments();

    const functionResult: FunctionResult<ReturnType, Schema, Args> = { function: this };

    const invocationContext = await kernel.onFunctionInvocation({
      arguments: args,
      function: this,
      functionResult,
      isStreaming: true,
      functionCallback: async (context) => {
        const enumerable = this.invokeStreamingCore(kernel, args);
        context.result.value = enumerable;
      },
    });

    yield* invocationContext.result.value as AsyncGenerator<T>;

    // for await (const value of enumerable) {
    //   yield value;
    // }
    // yield* this.invokeStreamingCore<T>(kernel, args ?? new KernelArguments());
  }

  asAIFunction(kernel: Kernel) {
    return AIFunctionFactory.create(
      async (args: Args) => (await this.invoke(kernel, new KernelArguments(args, this.executionSettings))).value,
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
