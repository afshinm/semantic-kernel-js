import { ChatClient, type ChatResponse } from '@semantic-kernel/ai';
import { ChatPromptParser } from '../internalUtilities';
import { type Kernel } from '../Kernel';
import { type PromptExecutionSettings } from '../promptExecutionSettings/PromptExecutionSettings';
import { toChatOptions } from '../promptExecutionSettings/PromptExecutionSettingsMapper';
import {
  PassThroughPromptTemplate,
  type PromptTemplate,
  PromptTemplateConfig,
  type PromptTemplateFormat,
} from '../promptTemplate';
import '../serviceProviderExtension';
import { type FunctionResult } from './FunctionResult';
import { type KernelArguments } from './KernelArguments';
import { KernelFunction } from './KernelFunction';

// export type KernelFunctionFromPromptMetadata = KernelFunctionMetadata & {
//   prompt: string;
//   templateFormat: PromptTemplateFormat;
//   inputVariables?: string[];
//   allowDangerouslySetContent?: boolean;
// };

export class KernelFunctionFromPrompt extends KernelFunction<ChatResponse> {
  private promptTemplate: PromptTemplate;

  constructor({
    name,
    pluginName,
    description,
    prompt,
    templateFormat,
    promptTemplate,
    promptTemplateConfig,
  }: {
    name?: string;
    pluginName?: string;
    description?: string;
    prompt?: string;
    templateFormat?: PromptTemplateFormat;
    promptTemplate?: PromptTemplate;
    promptTemplateConfig?: PromptTemplateConfig;
  }) {
    super({
      name: name ?? KernelFunctionFromPrompt.createRandomFunctionName(),
      pluginName,
      description: description ?? 'Generic function, unknown purpose',
    });

    if (!prompt && !promptTemplate && !promptTemplateConfig) {
      throw new Error('Either prompt, promptTemplate, or promptTemplateConfig must be provided');
    }

    templateFormat = templateFormat ?? 'passthrough';

    if (!promptTemplate) {
      if (!promptTemplateConfig) {
        promptTemplateConfig = new PromptTemplateConfig({
          prompt: prompt as string,
          name,
          description,
          templateFormat,
        });
      }

      promptTemplate = this.getPromptTemplate(promptTemplateConfig);
    }

    this.promptTemplate = promptTemplate;
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

  private getPromptTemplate = (promptTemplateConfig: PromptTemplateConfig): PromptTemplate => {
    switch (promptTemplateConfig.templateFormat) {
      case 'passthrough':
        return new PassThroughPromptTemplate(promptTemplateConfig);
      default:
        throw new Error(`${promptTemplateConfig.templateFormat} template rendering not implemented`);
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

    const renderedPrompt = await this.promptTemplate.render(kernel, args);

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
