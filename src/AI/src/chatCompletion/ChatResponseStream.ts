import { ChatResponseUpdate } from './ChatResponseUpdate';

const LINE_BREAK = '\n';

/**
 * Represents a stream of chat responses.
 */
export class ChatResponseStream {
  private readonly stream: ReadableStream<Uint8Array>;

  constructor(generatorOrStream: AsyncGenerator<ChatResponseUpdate> | ReadableStream) {
    const encoder = new TextEncoder();

    if (generatorOrStream instanceof ReadableStream) {
      this.stream = generatorOrStream;
    } else {
      this.stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          for await (const chunk of generatorOrStream) {
            const chunkData = encoder.encode(JSON.stringify(chunk) + LINE_BREAK);
            controller.enqueue(chunkData);
          }
          controller.close();
        },
      });
    }
  }

  /**
   * Converts the stream to a {@link Response} object.
   * @param init - Optional {@link ResponseInit} to customize the response.
   * @returns A {@link Response} object containing the stream.
   */
  asResponse(init?: ResponseInit): Response {
    return new Response(this.stream, {
      status: init?.status ?? 200,
      headers: init?.headers ?? {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  /**
   * Reads the stream and yields {@link ChatResponseUpdate} objects.
   */
  async *read(): AsyncGenerator<ChatResponseUpdate> {
    const decoder = new TextDecoder();

    if (this.stream) {
      const reader = this.stream.getReader();
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split(LINE_BREAK).filter((line) => line.trim() !== '');

        for (const line of lines) {
          yield ChatResponseUpdate.fromJSON(line);
        }

        done = readerDone;
      }
    }
  }

  [Symbol.asyncIterator](): AsyncGenerator<ChatResponseUpdate> {
    return this.read();
  }
}
