import { PromptExecutionSettings } from '../AI';
import { Kernel } from '../Kernel';
import { ChatClient, ChatOptions } from '../chatCompletion';
import { type FromSchema } from '../jsonSchema';
import { KernelFunctionFromPromptMetadata, PassThroughPromptTemplate, PromptTemplate, PromptTemplateFormat } from '../promptTemplate';
import { KernelFunction } from './KernelFunction';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schema = {
  type: 'object',
} as const;

export type PromptType = FromSchema<typeof schema>;

export class KernelFunctionFromPrompt extends KernelFunction<typeof schema, PromptType> {
  private constructor(kernelFunctionFromPromptMetadata: KernelFunctionFromPromptMetadata<typeof schema>) {
    super(kernelFunctionFromPromptMetadata);
  }

  /**
   * Creates a new kernel function from a prompt.
   * @param params The parameters to create the kernel function from a prompt.
   * @param params.template The template for the prompt.
   * @param params.name The name of the kernel function (optional).
   * @param params.description The description of the kernel function (optional).
   * @param params.templateFormat The format of the template (optional).
   * @param params.inputVariables The input variables for the prompt (optional).
   * @param params.allowDangerouslySetContent Whether to allow dangerously set content (optional).
   * @returns A new kernel function from a prompt.
   */
  static create({
    name,
    description,
    templateFormat,
    ...props
  }: {
    promptTemplate: string;
    name?: string;
    description?: string;
    templateFormat?: PromptTemplateFormat;
    inputVariables?: string[];
    allowDangerouslySetContent?: boolean;
  }) {
    return new KernelFunctionFromPrompt({
      name: name ?? KernelFunctionFromPrompt.createRandomFunctionName(),
      description: description ?? 'Generic function, unknown purpose',
      templateFormat: templateFormat ?? 'passthrough',
      template: props.promptTemplate,
      ...props,
    });
  }

  override async invokeCore(args?: PromptType, kernel?: Kernel) {
    const { renderedPrompt, service, executionSettings } = await this.renderPrompt(kernel, args);

    if (!service) {
      throw new Error('Service not found in kernel');
    }

    if (service instanceof ChatClient) {
      if (executionSettings) {
        this.addFunctionsToChatOptions(kernel, chatOptions);
      }

      const chatCompletionResult = await service.complete(renderedPrompt, chatOptions);

      return {
        chatCompletion: chatCompletionResult,
        renderedPrompt: renderedPrompt,
      };
    }

    throw new Error(`Unsupported service type: ${service}`)
  }

  override async *invokeStreamingCore(args?: PromptType, kernel?: Kernel) {
    const { renderedPrompt, chatClient, chatOptions } = await this.renderPrompt(kernel, args);

    if (!chatClient) {
      throw new Error('ChatClient not found in kernel');
    }

    if (chatOptions) {
      this.addFunctionsToChatOptions(kernel, chatOptions);
    }

    const chatCompletionUpdates = chatClient.completeStreaming(renderedPrompt, chatOptions);

    for await (const chatCompletionUpdate of chatCompletionUpdates) {
      yield chatCompletionUpdate;
    }
  }

  private getPromptTemplate = (): PromptTemplate => {
    const metadata = this.metadata as KernelFunctionFromPromptMetadata;
    switch (metadata.templateFormat) {
      case 'passthrough':
        return new PassThroughPromptTemplate(metadata.template);
      default:
        throw new Error(`${metadata.templateFormat} template rendering not implemented`);
    }
  };

  private addFunctionsToChatOptions(kernel?: Kernel, chatOptions?: ChatOptions) {
    if (!kernel) {
      return;
    }

    if (!chatOptions) {
      return;
    }

    const plugins = kernel.plugins.getPlugins();
    const availableFunctions: Array<KernelFunction> = [];

    for (const plugin of plugins) {
      for (const kernelFunction of plugin.functions.values()) {
        availableFunctions.push(kernelFunction);
      }
    }

    chatOptions.tools = [...(chatOptions.tools ?? []), ...availableFunctions];
  }

  private async renderPrompt(
    kernel?: Kernel,
    args?: PromptType
  ): Promise<{
    renderedPrompt: string;
    executionSettings?: PromptExecutionSettings;
    service: ChatClient;
  }> {
    if (!kernel) {
      throw new Error('Kernel is required to render prompt');
    }

    const { service, executionSettings } =
      kernel.services.trySelectService({
        serviceType: ChatClient,
        kernelFunction: this,
      }) ?? {};

    if (!service) {
      throw new Error('Service not found in kernel');
    }

    const promptTemplate = this.getPromptTemplate();
    const renderedPrompt = await promptTemplate.render(kernel, args);

    return {
      renderedPrompt,
      executionSettings,
      service,
    };
  }

  private static createRandomFunctionName() {
    return `function_${Math.random().toString(36).substring(7)}`;
  }
}
