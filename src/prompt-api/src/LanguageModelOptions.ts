/**
 * Configuration options for connecting to a generic Language Model API
 */
export interface LanguageModelOptions {
  /** Base URL of the language model API */
  baseUrl: string;
  /** Model identifier */
  modelId: string;
  /** API key for authentication */
  apiKey?: string;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether the API follows OpenAI-compatible format */
  openAICompatible?: boolean;
}

/**
 * Generic language model request format
 */
export interface LanguageModelRequest {
  /** Array of messages in the conversation */
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  /** Model identifier */
  model?: string;
  /** Temperature for response generation */
  temperature?: number;
  /** Maximum tokens to generate */
  max_tokens?: number;
  /** Whether to stream the response */
  stream?: boolean;
  /** Additional parameters */
  [key: string]: unknown;
}

/**
 * Generic language model response format
 */
export interface LanguageModelResponse {
  /** Array of response choices */
  choices: Array<{
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason?: string;
  }>;
  /** Usage information */
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  /** Response ID */
  id?: string;
  /** Response model */
  model?: string;
}
