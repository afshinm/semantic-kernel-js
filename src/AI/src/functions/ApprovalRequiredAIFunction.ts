import { DefaultJsonSchema, FromSchema, JsonSchema } from '../jsonSchema';
import { AIFunction } from './AIFunction';

/**
 * An AIFunction that requires approval before it can be invoked.
 * When this function is called, it will be replaced with a FunctionApprovalRequestContent
 * that indicates the function requires approval before it can be invoked.
 */
export abstract class ApprovalRequiredAIFunction<
  ReturnType = unknown,
  Schema extends JsonSchema = typeof DefaultJsonSchema,
  Args = FromSchema<Schema>,
> extends AIFunction<ReturnType, Schema, Args> {
  // This class serves as a marker to indicate that approval is required
  // The actual approval logic is handled by the FunctionInvokingChatClient
}
