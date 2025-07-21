import { ChatClient, ChatResponse } from '@semantic-kernel/ai';
import { ChatPromptParser } from '../internalUtilities';
import { type Kernel } from '../Kernel';
import { type PromptExecutionSettings } from '../promptExecutionSettings/PromptExecutionSettings';
import { toChatOptions } from '../promptExecutionSettings/PromptExecutionSettingsMapper';
import {
  type KernelFunctionFromPromptMetadata,
  PassThroughPromptTemplate,
  type PromptTemplate,
} from '../promptTemplate';
import '../serviceProviderExtension';
import { FunctionResult } from './FunctionResult';
import { type KernelArguments } from './KernelArguments';
import { KernelFunction } from './KernelFunction';

export class KernelFunctionFromPrompt extends KernelFunction<ChatResponse> {
  private constructor(kernelFunctionFromPromptMetadata: KernelFunctionFromPromptMetadata) {
    super(kernelFunctionFromPromptMetadata);
  }

  /**
   * Creates a new kernel function from a prompt.
   * @param prompt The prompt to create the kernel function from.
   * @param params The parameters to create the kernel function from a prompt.
   * @returns A new kernel function from a prompt.
   */
  static create(prompt: string, props?: Partial<KernelFunctionFromPromptMetadata>) {
    const { name, description, templateFormat } = props ?? {};

    return new KernelFunctionFromPrompt({
      prompt,
      name: name ?? KernelFunctionFromPrompt.createRandomFunctionName(),
      description: description ?? 'Generic function, unknown purpose',
      templateFormat: templateFormat ?? 'passthrough',
      ...props,
    });
  }

  override async invokeCore(kernel: Kernel, args: KernelArguments): Promise<FunctionResult<ChatResponse>> {
    const { renderedPrompt, service, executionSettings } = await this.renderPrompt(kernel, args);

    if (!service) {
      throw new Error('Service not found in kernel');
    }

    const promptOrChatMessages = ChatPromptParser.tryParse(renderedPrompt) ?? renderedPrompt;

    if (service instanceof ChatClient) {
      const chatCompletionResult = await service.getResponse(
        promptOrChatMessages,
        toChatOptions(kernel, executionSettings)
      );

      return {
        function: this,
        value: chatCompletionResult,
        renderedPrompt: renderedPrompt,
      };
    }

    throw new Error(`Unsupported service type: ${service}`);
  }

  override async *invokeStreamingCore<T>(kernel: Kernel, args: KernelArguments): AsyncGenerator<T> {
    const { renderedPrompt, service, executionSettings } = await this.renderPrompt(kernel, args);

    if (!service) {
      throw new Error('Service not found in kernel');
    }

    const promptOrChatMessages = ChatPromptParser.tryParse(renderedPrompt) ?? renderedPrompt;

    if (service instanceof ChatClient) {
      const chatCompletionUpdates = service.getStreamingResponse(
        promptOrChatMessages,
        toChatOptions(kernel, executionSettings)
      );

      for await (const chatCompletionUpdate of chatCompletionUpdates) {
        yield chatCompletionUpdate as T;
      }

      return;
    }

    throw new Error(`Unsupported service type: ${service}`);
  }

  private getPromptTemplate = (): PromptTemplate => {
    const metadata = this.metadata as KernelFunctionFromPromptMetadata;
    switch (metadata.templateFormat) {
      case 'passthrough':
        return new PassThroughPromptTemplate(metadata.prompt);
      default:
        throw new Error(`${metadata.templateFormat} template rendering not implemented`);
    }
  };

  private async renderPrompt(
    kernel: Kernel,
    args: KernelArguments
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
