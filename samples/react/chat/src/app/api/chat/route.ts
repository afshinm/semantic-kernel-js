import { OpenAIChatClient } from '@semantic-kernel/openai';
import { Kernel, StreamResponse } from 'semantic-kernel';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt) {
    return new Response('Prompt is required', { status: 400 });
  }

  const kernel = new Kernel().addService(
    new OpenAIChatClient({
      modelId: 'gpt-3.5-turbo',
    })
  );

  return new StreamResponse(kernel.invokeStreamingPrompt(prompt, {})).toResponse();
}
