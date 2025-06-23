import { ChatResponseUpdate } from './ChatResponseUpdate';

const DELIMITER = '\n';

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
            const chunkData = encoder.encode(JSON.stringify(chunk) + DELIMITER);
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
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(init?.headers ?? {}),
      },
    });
  }

  /**
   * Reads the stream and yields {@link ChatResponseUpdate} objects.
   */
  async *read(): AsyncGenerator<ChatResponseUpdate> {
    const decoder = new TextDecoder();
    const reader = this.stream.getReader();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(DELIMITER);
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim()) {
            yield ChatResponseUpdate.fromJSON(line);
          }
        }
      }

      if (done) {
        if (buffer.trim()) {
          yield ChatResponseUpdate.fromJSON(buffer); // flush last line
        }
        break;
      }
    }
  }

  [Symbol.asyncIterator](): AsyncGenerator<ChatResponseUpdate> {
    return this.read();
  }
}
