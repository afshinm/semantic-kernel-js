import { Kernel } from '../Kernel';
import { ChatClient, ChatOptions } from '../chatCompletion';
import { type FromSchema } from '../jsonSchema';
import { KernelFunctionFromPromptMetadata, PassThroughPromptTemplate, PromptTemplate, PromptTemplateFormat } from '../promptTemplate';
import { KernelFunction } from './KernelFunction';


export type PromptRenderingResult = {
  renderedPrompt: string;
  chatOptions?: ChatOptions;
  chatClient: ChatClient;
};

const schema = {
  type: 'object',
} as const;

export type PromptType = FromSchema<typeof schema>;

export class KernelFunctionFromPrompt extends KernelFunction<
  typeof schema,
  PromptType
> {
  private readonly kernelFunctionFromPromptMetadata: KernelFunctionFromPromptMetadata<typeof schema>;

  public override get metadata(): KernelFunctionFromPromptMetadata<typeof schema> {
    return this.kernelFunctionFromPromptMetadata;
  }

  private constructor(kernelFunctionFromPromptMetadata: KernelFunctionFromPromptMetadata<typeof schema>) {
    super();
    this.kernelFunctionFromPromptMetadata = kernelFunctionFromPromptMetadata;
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

  override async invokeCore (args?: PromptType, kernel?: Kernel) {
    const { renderedPrompt, chatClient, chatOptions } = await this.renderPrompt(kernel, args);

    if (!chatClient) {
      throw new Error('ChatClient not found in kernel');
    }

      const chatCompletionResult = await chatClient.complete(renderedPrompt, chatOptions);

      return {
        chatCompletion: chatCompletionResult,
        renderedPrompt: renderedPrompt,
      };
  };

  override async *invokeStreamingCore(args?: PromptType, kernel?: Kernel) {
    const { renderedPrompt, chatClient, chatOptions } = await this.renderPrompt(kernel, args);

    if (!chatClient) {
      throw new Error('ChatClient not found in kernel');
    }

    const chatCompletionUpdates = chatClient.completeStreaming(renderedPrompt, chatOptions);

    for await (const chatCompletionUpdate of chatCompletionUpdates) {
      yield chatCompletionUpdate;
    }
  }

  private getPromptTemplate = (): PromptTemplate => {
    switch (this.metadata.templateFormat) {
      case 'passthrough':
        return new PassThroughPromptTemplate(this.metadata.template);
      default:
        throw new Error(`${this.metadata.templateFormat} template rendering not implemented`);
    }
  };

  private async renderPrompt(kernel?: Kernel, args?: PromptType): Promise<PromptRenderingResult> {
    if (!kernel) {
      throw new Error('Kernel is required to render prompt');
    }

    const promptTemplate = this.getPromptTemplate();

    const { chatClient, chatOptions } = kernel.services.trySelectChatClient({
      kernelFunction: this,
    }) ?? {};

    if (!chatClient) {
      throw new Error('ChatClient not found in kernel');
    }

    const renderedPrompt = await promptTemplate.render(kernel, args);

    return {
      renderedPrompt,
      chatOptions,
      chatClient,
    };
  }

  private static createRandomFunctionName() {
    return `function_${Math.random().toString(36).substring(7)}`;
  }
}
