import { ChatClient, type ChatResponse } from '@semantic-kernel/ai';
import { Logger, LoggerFactory } from '@semantic-kernel/common';
import { PromptRenderContext } from '../filters';
import { ChatPromptParser } from '../internalUtilities';
import { type Kernel } from '../Kernel';
import { type PromptExecutionSettings } from '../promptExecutionSettings/PromptExecutionSettings';
import { toChatOptions } from '../promptExecutionSettings/PromptExecutionSettingsMapper';
import {
  HandlebarsPromptTemplate,
  type PromptTemplate,
  PromptTemplateConfig,
  type PromptTemplateFormat,
} from '../promptTemplate';
import '../serviceProviderExtension';
import { type FunctionResult } from './FunctionResult';
import { type KernelArguments } from './KernelArguments';
import { KernelFunction } from './KernelFunction';

export class KernelFunctionFromPrompt extends KernelFunction<ChatResponse> {
  private _promptTemplate: PromptTemplate;
  private _logger: Logger;

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

    this._logger = LoggerFactory.getLogger();

    if (!prompt && !promptTemplate && !promptTemplateConfig) {
      throw new Error('Either prompt, promptTemplate, or promptTemplateConfig must be provided');
    }

    templateFormat = templateFormat ?? 'handlebars';

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

    this._promptTemplate = promptTemplate;
  }

  override async invokeCore(kernel: Kernel, args: KernelArguments): Promise<FunctionResult<ChatResponse>> {
    const { renderedPrompt, service, executionSettings, functionResult } = await this.renderPrompt({
      kernel,
      args,
      isStreaming: false,
    });

    if (!service) {
      throw new Error('Service not found in kernel');
    }

    if (functionResult) {
      functionResult.renderedPrompt = renderedPrompt;
      return functionResult;
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
    const { renderedPrompt, service, executionSettings } = await this.renderPrompt({
      kernel,
      args,
      isStreaming: true,
    });

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
      case 'handlebars':
        return new HandlebarsPromptTemplate(promptTemplateConfig);
      default:
        throw new Error(`${promptTemplateConfig.templateFormat} template rendering not implemented`);
    }
  };

  private async renderPrompt({
    kernel,
    args,
    isStreaming,
  }: {
    kernel: Kernel;
    args: KernelArguments;
    isStreaming: boolean;
  }): Promise<{
    renderedPrompt: string;
    executionSettings?: PromptExecutionSettings;
    service: ChatClient;
    functionResult?: FunctionResult<ChatResponse>;
  }> {
    const { service, executionSettings } =
      kernel.services.trySelectService({
        serviceType: ChatClient,
        kernelFunction: this,
      }) ?? {};

    if (!service) {
      throw new Error('Service not found in kernel');
    }

    const { renderedPrompt, result: functionResult } = await kernel.onPromptRender({
      function: this,
      args,
      isStreaming,
      executionSettings,
      renderCallback: async (context: PromptRenderContext) => {
        const renderedPrompt = await this._promptTemplate.render(kernel, args);
        context.renderedPrompt = renderedPrompt;

        this._logger.trace(`Rendered prompt: ${context.renderedPrompt}`, { executionSettings });
      },
    });

    if (!renderedPrompt) {
      throw new Error('Rendered prompt is empty');
    }

    return {
      service,
      executionSettings,
      renderedPrompt,
      functionResult,
    };
  }

  private static createRandomFunctionName() {
    return `function_${Math.random().toString(36).substring(7)}`;
  }
}
