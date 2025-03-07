import { AIFunction } from './AIFunction';
import { AIFunctionMetadata } from './AIFunctionMetadata';
import { AIFunctionParameterMetadata } from './AIFunctionParameterMetadata';
import { FromSchema } from 'json-schema-to-ts';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AIFunctionFactory {
  static create<PARAMETERS extends AIFunctionParameterMetadata, SCHEMA = FromSchema<PARAMETERS>>(
    delegate: (args: SCHEMA) => unknown | Promise<unknown>,
    metadata?: AIFunctionMetadata<PARAMETERS>
  ): AIFunction<PARAMETERS, SCHEMA> {
    return new (class extends AIFunction<PARAMETERS, SCHEMA> {
      metadata = {
        // Take the name from the metadata, or the delegate name, or default to an empty string
        name: metadata?.name ?? delegate.name ?? '',
        ...metadata,
      };

      public constructor() {
        super();
      }

      protected async invokeCore(args: SCHEMA): Promise<unknown> {
        return delegate(args);
      }
    })();
  }
}
