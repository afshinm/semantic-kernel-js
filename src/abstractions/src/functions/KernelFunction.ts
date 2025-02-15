import { Kernel } from '../Kernel';
import { ChatOptions } from '../chatCompletion';
import { FromSchema } from '../jsonSchema';
import { AIFunction } from './AIFunction';
import { AIFunctionMetadata } from './AIFunctionMetadata';
import { AIFunctionParameterMetadata } from './AIFunctionParameterMetadata';


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
  chatOptions?: Map<string, ChatOptions>;
};

export abstract class KernelFunction<
  PARAMETERS extends AIFunctionParameterMetadata = AIFunctionParameterMetadata,
  SCHEMA = FromSchema<PARAMETERS>,
> extends AIFunction<PARAMETERS, SCHEMA> {
  abstract override get metadata(): KernelFunctionMetadata<PARAMETERS>;

  protected abstract override invokeCore(args?: SCHEMA, kernel?: Kernel): Promise<unknown>;

  protected abstract invokeStreamingCore(args?: SCHEMA, kernel?: Kernel): AsyncGenerator<unknown>;

  override async invoke (args?: SCHEMA, kernel?: Kernel): Promise<unknown> {
    return this.invokeCore(args, kernel);
  };

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
      super();
    }

    override get metadata(): KernelFunctionMetadata<PARAMETERS> {
      return metadata;
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
