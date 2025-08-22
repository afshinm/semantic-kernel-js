import { KernelArguments } from '..';
import { Kernel } from '../Kernel';

export interface PromptTemplate {
  render(kernel: Kernel, args: KernelArguments): string | Promise<string>;
}
