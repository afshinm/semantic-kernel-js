import { FunctionChoiceBehaviorBase } from '../functionChoiceBehaviors/FunctionChoiceBehaviorBase';

/**
 * Gets the default service identifier.
 * In a dictionary of {@link PromptExecutionSettings}, this is the key that should be used settings considered the default.
 */
export const defaultServiceId = 'default';

/**
 * Service identifier.
 */
export type ServiceId = string;

/**
 * Provides execution settings for an AI request.
 * Implementors of {@link TextGenerationService} or {@link ChatCompletionService} can extend this
 * if the service they are calling supports additional properties. For an example, please reference
 * the {@link OpenAIPromptExecutionSettings} implementation.
 */
export interface PromptExecutionSettings {
  /**
   * Service identifier.
   * This identifies the service these settings are configured for e.g., azure_openai_eastus, openai, ollama, huggingface, etc.
   * When provided, this service identifier will be the key in a dictionary collection of execution settings for both KernelArguments and PromptTemplateConfig.
   * If not provided the service identifier will be the default value in {@link defaultServiceId}.
   */
  serviceId?: ServiceId;

  /**
   * Model identifier.
   * This identifies the AI model these settings are configured for e.g., gpt-4, gpt-3.5-turbo
   */
  modelId?: string;

  /**
   * Extra properties that may be included in the serialized execution settings.
   * Avoid using this property if possible. Instead, use one of the classes that extends {@link PromptExecutionSettings}.
   */
  extensionData?: Map<string, unknown>;

  /**
   * Gets or sets the behavior defining the way functions are chosen by LLM and how they are invoked by AI connectors.
   */
  functionChoiceBehavior?: FunctionChoiceBehaviorBase;
}
