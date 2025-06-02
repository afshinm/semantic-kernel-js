import { ChatResponseUpdate, type DefaultJsonSchema, type FromSchema, type JsonSchema } from '@semantic-kernel/ai';
import { MapServiceProvider, type ServiceProvider } from '@semantic-kernel/service-provider';
import {
  type KernelArguments,
  type KernelFunction,
  KernelFunctionFromPrompt,
  type KernelPlugin,
  type KernelPlugins,
  MapKernelPlugins,
} from './functions';
import { type PromptExecutionSettings } from './promptExecutionSettings';
import { KernelFunctionFromPromptMetadata } from './promptTemplate';

/**
 * Represents a kernel.
 */
export class Kernel {
  private readonly _serviceProvider: ServiceProvider;
  private readonly _plugins: KernelPlugins;

  /**
   * Creates a new kernel.
   */
  public constructor() {
    this._serviceProvider = new MapServiceProvider();
    this._plugins = new MapKernelPlugins();
  }

  /**
   * Gets the {@link KernelPlugins} instance.
   */
  public get plugins() {
    return this._plugins;
  }

  /**
   * Gets the {@link ServiceProvider} instance.
   */
  public get services() {
    return this._serviceProvider;
  }

  /**
   * Adds a service to the kernel.
   * @param service The service to add.
   * @returns The kernel.
   */
  public addService(...props: Parameters<ServiceProvider['addService']>) {
    this._serviceProvider.addService(...props);
    return this;
  }

  /**
   * Adds a plugin to the kernel.
   * @param plugin The plugin to add.
   * @returns The kernel.
   */
  public addPlugin(plugin: KernelPlugin) {
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
  public async invoke<
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

    const functionResult = await kernelFunction.invoke(this, args);
    return functionResult.value;
  }

  public invokeStreaming<
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
  public async invokePrompt(
    prompt: string,
    {
      args,
      executionSettings,
      ...props
    }: Omit<Partial<KernelFunctionFromPromptMetadata>, 'executionSettings'> & {
      args?: KernelArguments;
      executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
    }
  ) {
    const kernelFunctionFromPrompt = KernelFunctionFromPrompt.create(prompt, props);

    return this.invoke({ kernelFunction: kernelFunctionFromPrompt, args, executionSettings });
  }

  /**
   * Invokes a streaming prompt.
   * @param prompt Prompt to invoke.
   * @param params The parameters for the prompt.
   * @returns A stream of {@link ChatResponseUpdate} objects.
   */
  public invokeStreamingPrompt(
    prompt: string,
    {
      args,
      executionSettings,
      ...props
    }: Omit<Partial<KernelFunctionFromPromptMetadata>, 'executionSettings'> & {
      args?: KernelArguments;
      executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
    }
  ) {
    const kernelFunctionFromPrompt = KernelFunctionFromPrompt.create(prompt, props);

    return this.invokeStreaming<ChatResponseUpdate>({
      kernelFunction: kernelFunctionFromPrompt,
      args,
      executionSettings,
    });
  }
}
