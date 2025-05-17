import { type DefaultJsonSchema, type FromSchema, type JsonSchema } from '@semantic-kernel/ai';
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
   * Invokes a kernel function.
   * @param params The parameters for the kernel function.
   * @param params.kernelFunction The kernel function to invoke.
   * @param params.kernelArguments The KernelArguments to pass to the kernel function (optional).
   * @param params.arguments The arguments to pass to the kernel function (optional).
   * @param params.executionSettings The execution settings to pass to the kernel function (optional).
   * @returns The result of the kernel function.
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

    return kernelFunction.invoke(this, args);
  }

  public invokeStreaming<
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

    return kernelFunction.invokeStreaming(this, args);
  }

  /**
   * Invokes a prompt.
   * @param params The parameters for the prompt.
   * @param params.promptTemplate The template for the prompt.
   * @param params.name The name of the kernel function (optional).
   * @param params.description The description of the kernel function (optional).
   * @param params.templateFormat The format of the template (optional).
   * @param params.inputVariables The input variables for the prompt (optional).
   * @param params.allowDangerouslySetContent Whether to allow dangerously set content (optional).
   * @param params.kernelArguments The KernelArguments to pass to the kernel function (optional).
   * @param params.arguments The arguments to pass to the kernel function (optional).
   * @param params.executionSettings The execution settings to pass to the kernel function (optional).
   * @returns The result of the prompt.
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
   * @param params The parameters for the prompt.
   * @param params.promptTemplate The template for the prompt.
   * @param params.name The name of the kernel function (optional).
   * @param params.description The description of the kernel function (optional).
   * @param params.templateFormat The format of the template (optional).
   * @param params.inputVariables The input variables for the prompt (optional).
   * @param params.allowDangerouslySetContent Whether to allow dangerously set content (optional).
   * @param params.kernelArguments The KernelArguments to pass to the kernel function (optional).
   * @param params.arguments The arguments to pass to the kernel function (optional).
   * @param params.executionSettings The execution settings to pass to the kernel function (optional).
   * @returns The result of the prompt.
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

    return this.invokeStreaming({ kernelFunction: kernelFunctionFromPrompt, args, executionSettings });
  }
}
