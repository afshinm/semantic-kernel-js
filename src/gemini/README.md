# Semantic Kernel Gemini Provider

This package provides integration with Google's Generative AI (Gemini) models for the Semantic Kernel JavaScript framework.

## Installation

```bash
npm install @semantic-kernel/gemini
```

## Usage

```typescript
import { GeminiChatClient } from '@semantic-kernel/gemini';
import { ChatMessage } from '@semantic-kernel/ai';

// Create a Gemini chat client
const client = new GeminiChatClient({
  apiKey: 'your-google-ai-api-key',
  modelId: 'gemini-1.5-flash',
});

// Send a chat message
const messages = [new ChatMessage({ role: 'user', content: 'Hello, how are you?' })];

const response = await client.getResponse(messages);
console.log(response.message.text);
```

## Features

- **Chat Completions**: Full support for Gemini chat completion API
- **Streaming**: Real-time streaming responses
- **Function Calling**: Support for Gemini's function calling capabilities
- **Multiple Models**: Support for all Gemini model variants
- **Type Safety**: Full TypeScript support with proper type definitions

## Supported Models

- `gemini-1.5-flash` - Fast and versatile performance
- `gemini-1.5-pro` - Complex reasoning tasks
- `gemini-1.0-pro` - Natural language tasks
- `gemini-1.0-pro-vision` - Multimodal reasoning

## Configuration

### API Key

You'll need a Google AI API key to use this provider. You can get one from the [Google AI Studio](https://aistudio.google.com/app/apikey).

### Environment Variables

You can set your API key as an environment variable:

```bash
export GOOGLE_AI_API_KEY=your-api-key-here
```

## Examples

### Basic Chat

```typescript
import { GeminiChatClient } from '@semantic-kernel/gemini';
import { ChatMessage } from '@semantic-kernel/ai';

const client = new GeminiChatClient({
  apiKey: process.env.GOOGLE_AI_API_KEY,
  modelId: 'gemini-1.5-flash',
});

const messages = [new ChatMessage({ role: 'user', content: 'Explain quantum computing' })];

const response = await client.getResponse(messages);
console.log(response.message.text);
```

### Streaming

```typescript
const streamingResponse = client.getStreamingResponse(messages);

for await (const update of streamingResponse) {
  for (const content of update.contents) {
    if (content instanceof TextContent) {
      process.stdout.write(content.text);
    }
  }
}
```

### Function Calling

```typescript
import { AIFunction, ChatOptions } from '@semantic-kernel/ai';

const weatherFunction = new AIFunction({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  schema: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'The city name' },
    },
    required: ['location'],
  },
});

const options = new ChatOptions();
options.tools = [weatherFunction];

const response = await client.getResponse(messages, options);
```

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
