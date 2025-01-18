import { JsonSchema } from '../jsonSchema';
import { ChatResponseFormat } from './ChatResponseFormat';

export class ChatResponseFormatJson extends ChatResponseFormat {
  constructor({
    schema,
    schemaName,
    schemaDescription,
  }: {
    schema?: JsonSchema;
    schemaName?: string;
    schemaDescription?: string;
  }) {
    super();

    if (!schema && (schemaName || schemaDescription)) {
      throw Error('Schema name and description can only be specified if a schema is provided.');
    }

    this.schema = schema;
    this.schemaName = schemaName;
    this.schemaDescription = schemaDescription;
  }

  readonly schema?: JsonSchema;
  readonly schemaName?: string;
  readonly schemaDescription?: string;
}
