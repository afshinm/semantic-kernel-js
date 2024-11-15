import { Kernel } from '../../Kernel';
import { FunctionName, KernelFunction } from '../../functions';
import { FunctionChoiceBehavior } from './FunctionChoiceBehavior';
import { FunctionChoiceBehaviorConfiguration } from './FunctionChoiceBehaviorConfiguration';

export class AutoFunctionChoiceBehavior extends FunctionChoiceBehavior {
  private readonly autoInvoke: boolean;
  private readonly functions: Array<string> | undefined;

  constructor(functions?: Array<KernelFunction>, autoInvoke: boolean = true) {
    super(functions);
    this.functions = functions
      ?.map(
        (f) =>
          f.metadata &&
          FunctionName.fullyQualifiedName({ functionName: f.metadata.name, pluginName: f.metadata.pluginName })
      )
      .filter((fqn) => fqn) as Array<string>;
    this.autoInvoke = autoInvoke;
  }

  override getConfiguredOptions({ kernel }: { kernel?: Kernel }): FunctionChoiceBehaviorConfiguration {
    const functions = this.getFunctions(this.functions, kernel, this.autoInvoke);

    return {
      choice: 'auto',
      autoInvoke: this.autoInvoke,
      functions,
    };
  }
}
