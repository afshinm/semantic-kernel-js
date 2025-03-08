import { ChatMessage } from '@semantic-kernel/ai';
import { Kernel } from '../Kernel';
import { FunctionName } from '../functions/FunctionName';
import { KernelFunction } from '../functions/KernelFunction';
import { FunctionChoiceBehaviorConfiguration } from './FunctionChoiceBehaviorConfiguration';
import { FunctionChoiceBehaviorOptions } from './FunctionChoiceBehaviorOptions';

export abstract class FunctionChoiceBehaviorBase {
  protected _functions: Array<KernelFunction> | undefined;
  protected defaultOptions: FunctionChoiceBehaviorOptions = {};

  protected constructor(functions?: Array<KernelFunction>) {
    this._functions = functions;
  }

  abstract getConfiguredOptions(context: {
    requestSequenceIndex: number;
    chatHistory: ChatMessage[];
    kernel?: Kernel;
  }): FunctionChoiceBehaviorConfiguration;

  protected getFunctions({
    functionFQNs,
    kernel,
    autoInvoke,
  }: {
    functionFQNs?: string[];
    kernel?: Kernel;
    autoInvoke?: boolean;
  }): Array<KernelFunction> | undefined {
    if (autoInvoke && !kernel) {
      throw new Error('Auto-invocation is not supported when no kernel is provided.');
    }

    const availableFunctions: Array<KernelFunction> = [];

    if (functionFQNs && functionFQNs.length > 0) {
      for (const functionFQN of functionFQNs) {
        const functionNameParts = FunctionName.parse(functionFQN);

        const kernelFunction = kernel?.plugins.getFunction(
          functionNameParts.functionName,
          functionNameParts.pluginName
        );
        if (kernelFunction) {
          availableFunctions.push(kernelFunction);
          continue;
        }

        if (autoInvoke) {
          throw new Error(`The specified function ${functionFQN} is not available in the kernel.`);
        }

        const fn = this._functions?.find(
          (f) =>
            f.metadata?.name === functionNameParts.functionName &&
            f.metadata?.pluginName === functionNameParts.pluginName
        );
        if (fn) {
          availableFunctions.push(fn);
        }

        throw new Error(`The specified function ${functionFQN} was not found.`);
      }
    } else if (functionFQNs?.length === 0) {
      return undefined;
    } else if (kernel) {
      for (const plugin of kernel.plugins.getPlugins()) {
        for (const fn of plugin.functions.values()) {
          availableFunctions.push(fn);
        }
      }
    }

    return availableFunctions;
  }
}
