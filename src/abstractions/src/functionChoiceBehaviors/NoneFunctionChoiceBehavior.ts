import { Kernel } from '../Kernel';
import { FunctionName } from '../functions/FunctionName';
import { KernelFunction } from '../functions/KernelFunction';
import { FunctionChoiceBehaviorBase } from './FunctionChoiceBehaviorBase';
import { FunctionChoiceBehaviorConfiguration } from './FunctionChoiceBehaviorConfiguration';
import { FunctionChoiceBehaviorOptions } from './FunctionChoiceBehaviorOptions';

export class NoneFunctionChoiceBehavior extends FunctionChoiceBehaviorBase {
  private readonly functions: Array<string> | undefined;
  public readonly options?: FunctionChoiceBehaviorOptions;

  constructor(functions?: Array<KernelFunction>, options?: FunctionChoiceBehaviorOptions) {
    super(functions);
    this.options = options;
    this.functions = functions
      ?.map(
        (f) =>
          f.metadata &&
          FunctionName.fullyQualifiedName({ functionName: f.metadata.name, pluginName: f.metadata.pluginName })
      )
      .filter((fqn) => fqn) as Array<string>;
  }

  override getConfiguredOptions({ kernel }: { kernel?: Kernel }): FunctionChoiceBehaviorConfiguration {
    const functions = this.getFunctions({
      functionFQNs: this.functions,
      kernel,
      autoInvoke: false,
    });

    return {
      choice: 'none',
      autoInvoke: false,
      functions,
      options: this.options ?? this.defaultOptions,
    };
  }
}
