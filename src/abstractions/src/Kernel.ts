import { ChatResponseUpdate, type DefaultJsonSchema, type FromSchema, type JsonSchema } from '@semantic-kernel/ai';
import { MapServiceProvider, type ServiceProvider } from '@semantic-kernel/common';
import {
  FunctionResult,
  KernelArguments,
  type KernelFunction,
  KernelFunctionFromPrompt,
  type KernelPlugin,
  type KernelPlugins,
  MapKernelPlugins,
} from './functions';
import { FunctionInvocationFilter } from './functions/FunctionInvocationFilter';
import { KernelFunctionInvocationContext } from './functions/kernelFunctionInvocationContext';
import { PromptRenderingContext } from './functions/PromptRenderingContext';
import { PromptRenderingFilter } from './functions/PromptRenderingFilter';
import { type PromptExecutionSettings } from './promptExecutionSettings';
import { type PromptTemplate, PromptTemplateFormat } from './promptTemplate';

/**
 * Represents a kernel.
 */
export class Kernel {
  private readonly _serviceProvider: ServiceProvider;
  private readonly _plugins: KernelPlugins;
  private readonly _functionInvocationFilters = new Array<FunctionInvocationFilter>();
  private readonly _promptRenderingFilters = new Array<PromptRenderingFilter>();

  /**
   * Creates a new kernel.
   */
  constructor() {
    this._serviceProvider = new MapServiceProvider();
    this._plugins = new MapKernelPlugins();
  }

  /**
   * Adds a function invocation filter to the kernel.
   * @param callback The callback to invoke when a function is called.
   */
  useFunctionInvocation(
    callback: (
      context: KernelFunctionInvocationContext,
      next: (context: KernelFunctionInvocationContext) => Promise<void>
    ) => Promise<void>
  ) {
    this._functionInvocationFilters.push(callback);
  }

  /**
   * Adds a prompt rendering filter to the kernel.
   * @param callback The callback to invoke when a prompt is rendered.
   */
  usePromptRendering(
    callback: (
      context: PromptRenderingContext,
      next: (context: PromptRenderingContext) => Promise<void>
    ) => Promise<void>
  ) {
    this._promptRenderingFilters.push(callback);
  }

  async onFunctionInvocation<
    ReturnType = unknown,
    Schema extends JsonSchema = typeof DefaultJsonSchema,
    Args = FromSchema<Schema>,
  >({
    function: fn,
    arguments: args,
    functionResult,
    isStreaming,
    functionCallback,
  }: {
    function: KernelFunction<ReturnType, Schema, Args>;
    arguments?: KernelArguments<Schema, Args>;
    functionResult: FunctionResult<ReturnType, Schema, Args>;
    isStreaming: boolean;
    functionCallback: (context: KernelFunctionInvocationContext) => Promise<void>;
  }) {
    const context: KernelFunctionInvocationContext<ReturnType, Schema, Args> = {
      isStreaming,
      kernel: this,
      function: fn,
      arguments: args ?? new KernelArguments<Schema, Args>(),
      result: functionResult,
    };

    await Kernel.invokeFilterOrFunction({
      functionFilters: this._functionInvocationFilters,
      functionCallback,
      context,
    });

    return context;
  }

  async onPromptRendering<
    ReturnType = unknown,
    Schema extends JsonSchema = typeof DefaultJsonSchema,
    Args = FromSchema<Schema>,
  >({
    function: fn,
    arguments: args,
    kernel,
    promptTemplate,
    promptCallback,
  }: {
    function: KernelFunction<ReturnType, Schema, Args>;
    arguments?: KernelArguments<Schema, Args>;
    kernel: Kernel;
    promptTemplate: PromptTemplate;
    promptCallback: (context: PromptRenderingContext) => Promise<void>;
  }) {
    const context: PromptRenderingContext<ReturnType, Schema, Args> = {
      kernel,
      function: fn,
      arguments: args ?? new KernelArguments<Schema, Args>(),
      promptTemplate,
    };

    await Kernel.invokePromptFilterOrCallback({
      promptFilters: this._promptRenderingFilters,
      promptCallback,
      context,
    });

    return context;
  }

  static async invokeFilterOrFunction({
    functionFilters,
    functionCallback,
    context,
    index,
  }: {
    functionFilters: Array<FunctionInvocationFilter>;
    functionCallback: (context: KernelFunctionInvocationContext) => Promise<void>;
    context: KernelFunctionInvocationContext;
    index?: number;
  }) {
    index = index ?? 0;

    if (functionFilters.length > 0 && index < functionFilters.length) {
      const functionFilter = functionFilters[index];
      await functionFilter(
        context,
        async (context) =>
          await Kernel.invokeFilterOrFunction({
            functionFilters,
            functionCallback,
            context,
            index: index + 1,
          })
      );
    } else {
      await functionCallback(context);
    }
  }

  static async invokePromptFilterOrCallback({
    promptFilters,
    promptCallback,
    context,
    index,
  }: {
    promptFilters: Array<PromptRenderingFilter>;
    promptCallback: (context: PromptRenderingContext) => Promise<void>;
    context: PromptRenderingContext;
    index?: number;
  }) {
    index = index ?? 0;

    if (promptFilters.length > 0 && index < promptFilters.length) {
      const promptFilter = promptFilters[index];
      await promptFilter(
        context,
        async (context) =>
          await Kernel.invokePromptFilterOrCallback({
            promptFilters,
            promptCallback,
            context,
            index: index + 1,
          })
      );
    } else {
      await promptCallback(context);
    }
  }

  /**
   * Gets the {@link KernelPlugins} instance.
   */
  get plugins() {
    return this._plugins;
  }

  /**
   * Gets the {@link ServiceProvider} instance.
   */
  get services() {
    return this._serviceProvider;
  }

  /**
   * Adds a service to the kernel.
   * @param service The service to add.
   * @returns The kernel.
   */
  addService(...props: Parameters<ServiceProvider['addService']>) {
    this._serviceProvider.addService(...props);
    return this;
  }

  /**
   * Adds a plugin to the kernel.
   * @param plugin The plugin to add.
   * @returns The kernel.
   */
  addPlugin(plugin: KernelPlugin) {
    this._plugins.addPlugin(plugin);
    return this;
  }

  /**
   * Invokes a KernelFunction.
   * @param params The parameters for the kernel function.
   * @param params.kernelFunction The kernel function to invoke.
   * @param params.args The arguments to pass to the kernel function (optional).
   * @param params.executionSettings The execution settings to pass to the kernel function (optional).
   * @returns The result of the KernelFunction.
   */
  async invoke<ReturnType = unknown, Schema extends JsonSchema = typeof DefaultJsonSchema, Args = FromSchema<Schema>>({
    kernelFunction,
    args,
    executionSettings,
  }: {
    kernelFunction: KernelFunction<ReturnType, Schema, Args>;
    args?: KernelArguments<Schema, Args>;
    executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
  }) {
    if (executionSettings) {
      kernelFunction.executionSettings = executionSettings;
    }

    const functionResult = await kernelFunction.invoke(this, args);
    return functionResult.value;
  }

  invokeStreaming<
    T,
    ReturnType = unknown,
    Schema extends JsonSchema = typeof DefaultJsonSchema,
    Args = FromSchema<Schema>,
  >({
    kernelFunction,
    args,
    executionSettings,
  }: {
    kernelFunction: KernelFunction<ReturnType, Schema, Args>;
    args?: KernelArguments<Schema, Args>;
    executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
  }) {
    if (executionSettings) {
      kernelFunction.executionSettings = executionSettings;
    }

    return kernelFunction.invokeStreaming<T>(this, args);
  }

  /**
   * Invokes a prompt.
   * @param prompt Prompt to invoke.
   * @param params The parameters for the prompt.
   * @returns The result of the prompt invocation.
   */
  async invokePrompt(
    prompt: string,
    {
      args,
      executionSettings,
      ...props
    }: {
      name?: string;
      pluginName?: string;
      args?: KernelArguments;
      templateFormat?: PromptTemplateFormat;
      executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
    } = {}
  ) {
    const kernelFunctionFromPrompt = new KernelFunctionFromPrompt({
      prompt,
      ...props,
    });

    return this.invoke({ kernelFunction: kernelFunctionFromPrompt, args, executionSettings });
  }

  /**
   * Invokes a streaming prompt.
   * @param prompt Prompt to invoke.
   * @param params The parameters for the prompt.
   * @returns A stream of {@link ChatResponseUpdate} objects.
   */
  invokeStreamingPrompt(
    prompt: string,
    {
      args,
      executionSettings,
      ...props
    }: {
      name?: string;
      pluginName?: string;
      args?: KernelArguments;
      templateFormat?: PromptTemplateFormat;
      executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
    } = {}
  ) {
    const kernelFunctionFromPrompt = new KernelFunctionFromPrompt({
      prompt,
      ...props,
    });

    return this.invokeStreaming<ChatResponseUpdate>({
      kernelFunction: kernelFunctionFromPrompt,
      args,
      executionSettings,
    });
  }
}
