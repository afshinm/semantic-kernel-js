import type { KernelFunction, KernelFunctionMetadata, KernelPlugin, MapKernelPlugin } from '.';

export type KernelPlugins = {
  addPlugin: (plugin: KernelPlugin) => KernelPlugins;
  getPlugins: () => Iterable<MapKernelPlugin>;
  getFunctionsMetadata: () => KernelFunctionMetadata[];
  getFunction: (functionName: string, pluginName?: string) => KernelFunction | undefined;
};

/**
 * Creates a new instance of KernelPlugins.
 * The internal representation plugins is a map of plugin names to plugins.
 * @returns A new instance of KernelPlugins.
 */
export class MapKernelPlugins implements KernelPlugins {
  private readonly plugins: Map<string, MapKernelPlugin> = new Map();

  addPlugin(plugin: KernelPlugin) {
    if (plugin.functions.length === 0) {
      throw new Error(`Plugin ${plugin.name} does not contain any functions`);
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} has already been added`);
    }

    const mapPlugin: MapKernelPlugin = {
      ...plugin,
      functions: new Map(),
    };

    for (const pluginFunction of plugin.functions) {
      if (pluginFunction.metadata) {
        if (mapPlugin.functions.has(pluginFunction.metadata.name)) {
          throw new Error(`Function ${pluginFunction.metadata.name} has already been added to plugin ${plugin.name}`);
        }

        // Add the plugin name to the metadata of each function
        pluginFunction.metadata = {
          ...pluginFunction.metadata,
          pluginName: plugin.name,
        };
        // TODO: is this necessary?
        mapPlugin.functions.set(pluginFunction.metadata.name, pluginFunction);
      }
    }

    this.plugins.set(plugin.name, mapPlugin);

    return this;
  }

  getPlugins() {
    return this.plugins.values();
  }

  /**
   * Gets a collection of KernelFunctionMetadata instances, one for every function in this plugin.
   */
  getFunctionsMetadata() {
    return Array.from(this.getPlugins()).flatMap((plugin) =>
      Array.from(plugin.functions.values())
        .filter((fn) => fn.metadata)
        .map((fn) => fn.metadata)
    );
  }

  getFunction(functionName: string, pluginName?: string) {
    if (pluginName) {
      // Search a specific plugin
      const plugin = this.plugins.get(pluginName);

      if (plugin) {
        const fn = plugin.functions.get(functionName);

        if (fn) {
          return fn;
        }
      }
    } else {
      // Search all plugins
      for (const plugin of this.plugins.values()) {
        const fn = plugin.functions.get(functionName);

        if (fn) {
          return fn;
        }
      }
    }

    return undefined;
  }
}
