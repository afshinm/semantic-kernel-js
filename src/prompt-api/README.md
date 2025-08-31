# @semantic-kernel/prompt-api

A connector package for integrating with generic prompt APIs and language model services in Semantic Kernel JS.

## Features

- **PromptApiChatClient**: Connect to prompt management services to fetch and manage prompt templates
- **LanguageModelChatClient**: Connect to generic HTTP-based language model APIs
- Support for OpenAI-compatible APIs
- Streaming response support
- TypeScript support with full type safety

## Installation

```bash
npm install @semantic-kernel/prompt-api
```

## Usage

### LanguageModelChatClient

Connect to any HTTP-based language model API that follows OpenAI-compatible format:

```typescript
import { LanguageModelChatClient } from '@semantic-kernel/prompt-api';
import { Kernel } from 'semantic-kernel';

const languageModelClient = new LanguageModelChatClient({
  baseUrl: 'https://your-api.example.com',
  modelId: 'your-model-id',
  apiKey: 'your-api-key',
  openAICompatible: true, // Set to false for non-OpenAI compatible APIs
});

const kernel = new Kernel().addService(languageModelClient);

// Use with kernel
const response = await kernel.invokePrompt('Hello, how are you?');
console.log(response);
```

### PromptApiChatClient

Connect to a prompt management service to fetch prompt templates:

```typescript
import { PromptApiChatClient } from '@semantic-kernel/prompt-api';
import { Kernel } from 'semantic-kernel';

const promptApiClient = new PromptApiChatClient({
  baseUrl: 'https://your-prompt-api.example.com',
  apiKey: 'your-api-key',
});

// Fetch a prompt by ID
const promptResponse = await promptApiClient.fetchPrompt({
  promptId: 'welcome-prompt',
  version: '1.0.0',
});

console.log(promptResponse.content); // The prompt template content
```

### Streaming Responses

Both clients support streaming responses:

```typescript
const kernel = new Kernel().addService(languageModelClient);

const streamingResponse = kernel.invokeStreamingPrompt('Tell me a story');

for await (const update of streamingResponse) {
  console.log(update.text);
}
```

## Configuration Options

### LanguageModelOptions

```typescript
interface LanguageModelOptions {
  baseUrl: string;           // Base URL of the language model API
  modelId: string;          // Model identifier
  apiKey?: string;          // API key for authentication
  headers?: Record<string, string>; // Custom headers
  timeout?: number;         // Request timeout in milliseconds
  openAICompatible?: boolean; // Whether the API follows OpenAI format
}
```

### PromptApiOptions

```typescript
interface PromptApiOptions {
  baseUrl: string;          // Base URL of the prompt API service
  apiKey?: string;          // API key for authentication
  headers?: Record<string, string>; // Custom headers
  timeout?: number;         // Request timeout in milliseconds
}
```

## API Endpoints

### Language Model API

For OpenAI-compatible APIs, the client expects:
- `POST /v1/chat/completions` - For chat completions
- Standard OpenAI request/response format

For non-OpenAI compatible APIs:
- `POST /completions` - For completions
- Custom request/response format (see LanguageModelRequest/Response types)

### Prompt API

The client expects:
- `POST /prompts` - For fetching prompts
- Request: `{ promptId: string, version?: string, parameters?: object }`
- Response: `{ content: string, metadata?: object }`

## License

MIT