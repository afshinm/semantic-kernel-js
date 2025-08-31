import { type KernelFunctionInvocationContext } from './KernelFunctionInvocationContext';

export type FunctionInvocationFilter = (
  context: KernelFunctionInvocationContext,
  next: (context: KernelFunctionInvocationContext) => Promise<void>
) => Promise<void>;
