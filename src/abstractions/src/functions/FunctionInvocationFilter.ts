import { KernelFunctionInvocationContext } from './kernelFunctionInvocationContext';

export type FunctionInvocationFilter = (
  context: KernelFunctionInvocationContext,
  next: (context: KernelFunctionInvocationContext) => Promise<void>
) => Promise<void>;
