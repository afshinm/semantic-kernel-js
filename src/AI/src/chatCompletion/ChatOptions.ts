import { AITool } from '../AITool';
import { AdditionalProperties } from '../AdditionalProperties';
import { ChatResponseFormat } from './ChatResponseFormat';
import { ChatToolMode } from './ChatToolMode';

export class ChatOptions {
  /**
   * Gets or sets an optional identifier used to associate a request with an existing conversation.
   * https://learn.microsoft.com/dotnet/ai/microsoft-extensions-ai#stateless-vs-stateful-clients: Stateless vs. stateful clients.
   */
  conversationId?: string;

  /**
   * Gets or sets additional per-request instructions to be provided to the ChatClient.
   */
  instructions?: string;

  /**
   * Gets or sets the temperature for generating chat responses.
   */
  public temperature?: number;

  /**
   *Gets or sets the maximum number of tokens in the generated chat response.
   */
  public maxOutputTokens?: number;

  /*
   * Gets or sets the "nucleus sampling" factor (or "top p") for generating chat responses.
   */
  public topP?: number;

  /**
   * Gets or sets a count indicating how many of the most probable tokens the model should consider when generating the next part of the text.
   */
  public topK?: number;

  /**
   * Gets or sets the frequency penalty for generating chat responses.
   */
  public frequencyPenalty?: number;

  /**
   * Gets or sets the presence penalty for generating chat responses.
   */
  public presencePenalty?: number;

  /**
   * Gets or sets a seed value used by a service to control the reproducibility of results.
   */
  public seed?: number;

  /**
   * Gets or sets the chat response format.
   */
  public responseFormat?: ChatResponseFormat;

  /**
   * Gets or sets the model ID for the chat request.
   */
  public modelId?: string;

  /**
   * Gets or sets the stop sequences for generating chat responses.
   * After a stop sequence is detected, the model stops generating further tokens for chat responses.
   */
  public stopSequences?: string[];

  /**
   * Gets or sets the tool mode for the chat request.
   */
  public toolMode?: ChatToolMode = ChatToolMode.Auto;

  /**
   * Gets or sets the list of tools to include with a chat request.
   */
  public tools?: AITool[];

  /**
   * Gets or sets any additional properties associated with the options.
   */
  public additionalProperties?: AdditionalProperties;

  /**
   * Gets or sets a flag to indicate whether a single response is allowed to include multiple tool calls.
   * If `false`, the `ChatClient` is asked to return a maximum of one tool call per request.
   * If `true`, there is no limit.
   * If `undefined`, the provider may select its own default.
   */
  public allowMultipleToolCalls?: boolean;

  constructor(props?: Omit<ChatOptions, 'clone'>) {
    this.temperature = props?.temperature;
    this.maxOutputTokens = props?.maxOutputTokens;
    this.topP = props?.topP;
    this.topK = props?.topK;
    this.frequencyPenalty = props?.frequencyPenalty;
    this.presencePenalty = props?.presencePenalty;
    this.seed = props?.seed;
    this.responseFormat = props?.responseFormat;
    this.modelId = props?.modelId;
    this.stopSequences = props?.stopSequences;
    this.toolMode = props?.toolMode;
    this.tools = props?.tools;
    this.additionalProperties = props?.additionalProperties;
  }

  clone(): ChatOptions {
    const options = new ChatOptions({
      temperature: this.temperature,
      maxOutputTokens: this.maxOutputTokens,
      topP: this.topP,
      topK: this.topK,
      frequencyPenalty: this.frequencyPenalty,
      presencePenalty: this.presencePenalty,
      seed: this.seed,
      responseFormat: this.responseFormat,
      modelId: this.modelId,
      stopSequences: this.stopSequences,
      toolMode: this.toolMode,
      tools: this.tools,
      additionalProperties: new AdditionalProperties(this.additionalProperties),
    });

    if (this.stopSequences) {
      options.stopSequences = [...this.stopSequences];
    }

    if (this.tools) {
      options.tools = [...this.tools];
    }

    return options;
  }
}
