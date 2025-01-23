import { JsonSchema } from '../jsonSchema';

export type AIFunctionParameterMetadata = Exclude< JsonSchema, boolean>;
