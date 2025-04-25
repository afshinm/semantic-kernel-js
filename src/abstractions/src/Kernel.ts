import { AIFunctionParameterMetadata } from '@semantic-kernel/ai';
import { MapServiceProvider, ServiceProvider } from '@semantic-kernel/service-provider';
import { KernelFunction, KernelFunctionFromPrompt, KernelPlugin, PromptType } from './functions';
import { KernelPlugins, MapKernelPlugins } from './functions/KernelPlugins';
import { PromptExecutionSettings } from './promptExecutionSettings/PromptExecutionSettings';
import { PromptTemplateFormat } from './promptTemplate';

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
  public async invoke<PARAMETERS extends AIFunctionParameterMetadata, SCHEMA>({
    kernelFunction,
    args,
    executionSettings,
  }: {
    kernelFunction: KernelFunction<PARAMETERS, SCHEMA>;
    args?: SCHEMA;
    executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
  }) {
    if (executionSettings) {
      kernelFunction.executionSettings = executionSettings;
    }

    return kernelFunction.invoke(this, args);
  }

  public invokeStreaming<PARAMETERS extends AIFunctionParameterMetadata, SCHEMA>({
    kernelFunction,
    args,
    executionSettings,
  }: {
    kernelFunction: KernelFunction<PARAMETERS, SCHEMA>;
    args?: SCHEMA;
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
  public async invokePrompt({
    promptTemplate,
    name,
    description,
    templateFormat,
    inputVariables,
    allowDangerouslySetContent,
    args,
    executionSettings,
  }: {
    promptTemplate: string;
    name?: string;
    description?: string;
    templateFormat?: PromptTemplateFormat;
    inputVariables?: string[];
    allowDangerouslySetContent?: boolean;
    args?: PromptType;
    executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
  }) {
    const kernelFunctionFromPrompt = KernelFunctionFromPrompt.create({
      promptTemplate,
      name,
      description,
      templateFormat,
      inputVariables,
      allowDangerouslySetContent,
    });

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
  public invokeStreamingPrompt({
    promptTemplate,
    name,
    description,
    templateFormat,
    inputVariables,
    allowDangerouslySetContent,
    args,
    executionSettings,
  }: {
    promptTemplate: string;
    name?: string;
    description?: string;
    templateFormat?: PromptTemplateFormat;
    inputVariables?: string[];
    allowDangerouslySetContent?: boolean;
    args?: PromptType;
    executionSettings?: Map<string, PromptExecutionSettings> | PromptExecutionSettings[] | PromptExecutionSettings;
  }) {
    const kernelFunctionFromPrompt = KernelFunctionFromPrompt.create({
      promptTemplate,
      name,
      description,
      templateFormat,
      inputVariables,
      allowDangerouslySetContent,
    });

    return this.invokeStreaming({ kernelFunction: kernelFunctionFromPrompt, args, executionSettings });
  }
}
