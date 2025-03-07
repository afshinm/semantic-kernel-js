/**
 * Represents a function name, which may include a plugin name.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class FunctionName {
  /**
   * The separator used between the plugin name and the function name, if a plugin name is present.
   */
  public static readonly NameSeparator = '_';

  static parse = (
    fullyQualifiedName: string,
    functionNameSeparator: string = FunctionName.NameSeparator
  ): {
    functionName: string;
    pluginName?: string;
  } => {
    if (!fullyQualifiedName) {
      throw new Error('fullyQualifiedName is required');
    }

    if (fullyQualifiedName.indexOf(functionNameSeparator) !== -1) {
      const parts = fullyQualifiedName.split(functionNameSeparator);
      const pluginName = parts[0].trim();
      const functionName = parts[1].trim();

      return {
        functionName,
        pluginName,
      };
    }

    return {
      functionName: fullyQualifiedName,
      pluginName: undefined,
    };
  };

  static fullyQualifiedName = ({
    functionName,
    pluginName,
    nameSeparator,
  }: {
    functionName: string;
    pluginName?: string;
    nameSeparator?: string;
  }) => (!pluginName ? functionName : `${pluginName}${nameSeparator ?? FunctionName.NameSeparator}${functionName}`);
}
