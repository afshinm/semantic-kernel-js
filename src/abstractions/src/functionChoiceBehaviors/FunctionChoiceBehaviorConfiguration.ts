import { KernelFunction } from '../functions';
import { FunctionChoice } from './FunctionChoice';
import { FunctionChoiceBehaviorOptions } from './FunctionChoiceBehaviorOptions';

export interface FunctionChoiceBehaviorConfiguration {
  choice: FunctionChoice;
  autoInvoke: boolean;
  options: FunctionChoiceBehaviorOptions;
  functions?: Array<KernelFunction>;
}
