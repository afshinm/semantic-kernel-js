import { ChatResponseUpdate, type DefaultJsonSchema, type FromSchema, type JsonSchema } from '@semantic-kernel/ai';
import { MapServiceProvider, type ServiceProvider } from '@semantic-kernel/common';
import {
  type FunctionInvocationFilter,
  type KernelFunctionInvocationContext,
  type PromptRenderContext,
  type PromptRenderFilter,
} from './filters';
import {
  FunctionResult,
  KernelArguments,
  type KernelFunction,
  KernelFunctionFromPrompt,
  type KernelPlugin,
  type KernelPlugins,
  MapKernelPlugins,
} from './functions';
import { type PromptExecutionSettings } from './promptExecutionSettings';
import { PromptTemplateFormat } from './promptTemplate';

/**
 * Represents a kernel.
 */
export class Kernel {
  private readonly _serviceProvider: ServiceProvider;
  private readonly _plugins: KernelPlugins;
  private readonly _functionInvocationFilters = new Array<FunctionInvocationFilter>();
  private readonly _promptRenderFilters = new Array<PromptRenderFilter>();

  /**
   * Creates a new kernel.
   */
  constructor() {
    this._serviceProvider = new MapServiceProvider();
    this._plugins = new MapKernelPlugins();
  }

  /**
   * Adds a prompt rendering filter to the kernel. These filters allow you to intercept and modify
   * prompt rendering operations using a middleware pattern. Filters are executed in registration order.
   *
   * @param callback The callback function that will be invoked when a prompt is rendered.
   *                 This function receives a PromptRenderContext and a next function.
   *                 Call next(context) to continue to the next filter or actual prompt rendering.
   *                 Omit calling next() to short-circuit the pipeline.
   *
   * @example
   * ```typescript
   * // Add a logging filter
   * kernel.usePromptRender(async (context, next) => {
   *   console.log('Rendering prompt for:', context.function.metadata.name);
   *   await next(context);
   *   console.log('Rendered prompt:', context.renderedPrompt);
   * });
   *
   * // Add a prompt modification filter
   * kernel.usePromptRender(async (context, next) => {
   *   await next(context);
   *   if (context.renderedPrompt) {
   *     context.renderedPrompt += '\nPlease provide a helpful response.';
   *   }
   * });
   * ```
   *
   * @see {@link PromptRenderContext} for details about the context object
   * @see {@link PromptRenderFilter} for the filter function signature
   */
  usePromptRender(
    callback: (context: PromptRenderContext, next: (context: PromptRenderContext) => Promise<void>) => Promise<void>
  ) {
    this._promptRenderFilters.push(callback);
  }

  /**
   * Internal method to handle prompt rendering with filters.
   */
  async onPromptRender({
    function: fn,
    args,
    isStreaming,
    executionSettings,
    renderCallback,
  }: {
    function: KernelFunction;
    args: KernelArguments;
    isStreaming: boolean;
    executionSettings?: PromptExecutionSettings;
    renderCallback: (context: PromptRenderContext) => Promise<void>;
  }) {
    const context: PromptRenderContext = {
      function: fn,
      isStreaming,
      kernel: this,
      executionSettings,
      arguments: args,
    };

    await Kernel.invokeFilterOrPromptRender({
      promptFilters: this._promptRenderFilters,
      renderCallback,
      context,
    });

    return context;
  }

  private static async invokeFilterOrPromptRender({
    promptFilters,
    renderCallback,
    context,
    index,
  }: {
    promptFilters: Array<PromptRenderFilter>;
    renderCallback: (context: PromptRenderContext) => Promise<void>;
    context: PromptRenderContext;
    index?: number;
  }) {
    index = index ?? 0;

    if (promptFilters.length > 0 && index < promptFilters.length) {
      const promptFilter = promptFilters[index];
      await promptFilter(
        context,
        async (context) =>
          await Kernel.invokeFilterOrPromptRender({
            promptFilters,
            renderCallback,
            context,
            index: index + 1,
          })
      );
    } else {
      await renderCallback(context);
    }
  }

  /**
   * Adds a function invocation filter to the kernel. These filters allow you to intercept and modify
   * function execution operations using a middleware pattern. Filters are executed in registration order.
   *
   * @param callback The callback function that will be invoked when a function is executed.
   *                 This function receives a KernelFunctionInvocationContext and a next function.
   *                 Call next(context) to continue to the next filter or actual function execution.
   *                 Omit calling next() to short-circuit the pipeline.
   *
   * @example
   * ```typescript
   * // Add a performance monitoring filter
   * kernel.useFunctionInvocation(async (context, next) => {
   *   const start = Date.now();
   *   console.log(`Starting: ${context.function.metadata.name}`);
   *
   *   await next(context);
   *
   *   const duration = Date.now() - start;
   *   console.log(`Completed ${context.function.metadata.name} in ${duration}ms`);
   * });
   *
   * // Add an error handling filter
   * kernel.useFunctionInvocation(async (context, next) => {
   *   try {
   *     await next(context);
   *   } catch (error) {
   *     console.error(`Function ${context.function.metadata.name} failed:`, error);
   *     throw error;
   *   }
   * });
   * ```
   *
   * @see {@link KernelFunctionInvocationContext} for details about the context object
   * @see {@link FunctionInvocationFilter} for the filter function signature
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
   * Internal method to handle function invocation with filters.
   */
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

  private static async invokeFilterOrFunction({
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
