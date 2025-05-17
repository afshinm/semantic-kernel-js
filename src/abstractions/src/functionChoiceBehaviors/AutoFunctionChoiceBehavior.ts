import { type Kernel } from '../Kernel';
import { FunctionName } from '../functions/FunctionName';
import { KernelFunction } from '../functions/KernelFunction';
import { FunctionChoiceBehaviorBase } from './FunctionChoiceBehaviorBase';
import { type FunctionChoiceBehaviorConfiguration } from './FunctionChoiceBehaviorConfiguration';
import { type FunctionChoiceBehaviorOptions } from './FunctionChoiceBehaviorOptions';

export class AutoFunctionChoiceBehavior extends FunctionChoiceBehaviorBase {
  private readonly autoInvoke: boolean;
  private readonly functions: Array<string> | undefined;
  public readonly options?: FunctionChoiceBehaviorOptions;

  constructor(functions?: Array<KernelFunction>, autoInvoke: boolean = true, options?: FunctionChoiceBehaviorOptions) {
    super(functions);
    this.options = options;
    this.autoInvoke = autoInvoke;
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
      autoInvoke: this.autoInvoke,
    });

    return {
      choice: 'auto',
      autoInvoke: this.autoInvoke,
      functions,
      options: this.options ?? this.defaultOptions,
    };
  }
}
