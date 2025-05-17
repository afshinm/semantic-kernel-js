import { type Kernel } from '../Kernel';
import { FunctionName, type KernelFunction } from '../functions';
import { FunctionChoiceBehaviorBase } from './FunctionChoiceBehaviorBase';
import { type FunctionChoiceBehaviorConfiguration } from './FunctionChoiceBehaviorConfiguration';
import { type FunctionChoiceBehaviorOptions } from './FunctionChoiceBehaviorOptions';

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
