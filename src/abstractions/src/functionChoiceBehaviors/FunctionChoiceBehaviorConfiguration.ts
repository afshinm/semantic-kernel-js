import { type FunctionChoice, type FunctionChoiceBehaviorOptions } from '.';
import { type KernelFunction } from '../functions';

export interface FunctionChoiceBehaviorConfiguration {
  choice: FunctionChoice;
  autoInvoke: boolean;
  options: FunctionChoiceBehaviorOptions;
  functions?: Array<KernelFunction>;
}
