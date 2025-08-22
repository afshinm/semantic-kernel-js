import { JSONSchema as JsonSchema } from 'json-schema-to-ts';

export const DefaultJsonSchema = {} as const satisfies JsonSchema;

export type { JsonSchema };
