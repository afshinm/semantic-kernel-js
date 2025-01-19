import { ModelId } from '../contents/ModelId';

/**
 * Provides metadata about an ChatClient
 */
export class ChatClientMetadata {
  /**
   * Initializes a new instance of the ChatClientMetadata class.
   *
   * @param providerName
   * The name of the chat completion provider, if applicable. Where possible, this should map to the
   * appropriate name defined in the OpenTelemetry Semantic Conventions for Generative AI systems.
   * @param providerUri The URL for accessing the chat completion provider, if applicable.
   * @param modelId The ID of the chat completion model used, if applicable.
   */
  constructor({
    providerName,
    providerUri,
    modelId,
  }: {
    providerName?: string;
    providerUri?: string;
    modelId?: ModelId;
  }) {
    this.modelId = modelId;
    this.providerName = providerName;
    this.providerUri = providerUri;
  }

  /**
   * Gets the name of the chat completion provider.
   * Where possible, this maps to the appropriate name defined in the
   * OpenTelemetry Semantic Conventions for Generative AI systems.
   */
  readonly providerName?: string;

  /**
   * Gets the URL for accessing the chat completion provider.
   */
  readonly providerUri?: string;

  /**
   * Gets the ID of the model used by this chat completion provider.
   * This value can be null if either the name is unknown or there are multiple possible models associated with this instance.
   * An individual request may override this value via ChatOptions.ModelId
   */
  readonly modelId?: ModelId;
}
