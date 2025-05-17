import { type KernelFunction } from '..';
import { AutoFunctionChoiceBehavior } from './AutoFunctionChoiceBehavior';
import { type FunctionChoiceBehaviorOptions } from './FunctionChoiceBehaviorOptions';
import { NoneFunctionChoiceBehavior } from './NoneFunctionChoiceBehavior';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class FunctionChoiceBehavior {
  static Auto(functions?: Array<KernelFunction>, autoInvoke: boolean = true, options?: FunctionChoiceBehaviorOptions) {
    return new AutoFunctionChoiceBehavior(functions, autoInvoke, options);
  }

  static None(functions?: Array<KernelFunction>, options?: FunctionChoiceBehaviorOptions) {
    return new NoneFunctionChoiceBehavior(functions, options);
  }
}
