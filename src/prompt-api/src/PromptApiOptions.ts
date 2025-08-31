/**
 * Configuration options for connecting to a Prompt API service
 */
export interface PromptApiOptions {
  /** Base URL of the prompt API service */
  baseUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Response from prompt API when fetching a prompt
 */
export interface PromptApiResponse {
  /** The prompt template content */
  content: string;
  /** Metadata about the prompt */
  metadata?: {
    name?: string;
    version?: string;
    description?: string;
    parameters?: string[];
  };
}

/**
 * Request to fetch a prompt from the API
 */
export interface PromptApiRequest {
  /** Unique identifier for the prompt */
  promptId: string;
  /** Optional version specifier */
  version?: string;
  /** Optional parameters to include in the request */
  parameters?: Record<string, unknown>;
}
