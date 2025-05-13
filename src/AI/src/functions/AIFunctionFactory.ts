import { DefaultJsonSchema, FromSchema, JsonSchema } from '../jsonSchema';
import { AIFunction } from './AIFunction';
import { AIFunctionArguments } from './AIFunctionArguments';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AIFunctionFactory {
  static create<ReturnType, Schema extends JsonSchema = typeof DefaultJsonSchema, Args = FromSchema<Schema>>(
    delegate: (args: Args) => ReturnType | Promise<ReturnType>,
    metadata?: {
      name?: string;
      description?: string;
      schema?: Schema;
    }
  ): AIFunction<ReturnType, Schema, Args> {
    return new (class extends AIFunction<ReturnType, Schema, Args> {
      public constructor() {
        super();

        // Take the name from the metadata, or the delegate name, or default to an empty string
        this.name = metadata?.name ?? delegate.name ?? '';
        this.description = metadata?.description ?? '';
        this.jsonSchema = metadata?.schema;
      }

      protected async invokeCore(args: AIFunctionArguments<Schema, Args>): Promise<ReturnType> {
        return delegate(args.arguments);
      }
    })();
  }
}
