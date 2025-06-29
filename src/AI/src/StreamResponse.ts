export type ServerSentEvent = {
  event: string | null;
  data: string;
  raw: string[];
};

/**
 * Generic class to handle streaming responses from a server.
 * Modified version of the Stream class from the OpenAI API.
 */
export class StreamResponse<Item> implements AsyncIterable<Item> {
  controller: AbortController;

  constructor(
    private iterator: AsyncGenerator<Item>,
    controller?: AbortController
  ) {
    this.controller = controller ?? new AbortController();
  }

  static fromSSEResponse<Item>(response: Response, controller?: AbortController) {
    let consumed = false;
    controller = controller ?? new AbortController();

    async function* iterator(): AsyncGenerator<Item> {
      if (consumed) throw new Error('Stream already consumed');
      consumed = true;
      let done = false;
      try {
        for await (const sse of _iterSSEMessages(response, controller)) {
          if (done) continue;
          if (sse.data.startsWith('[DONE]')) {
            done = true;
            continue;
          }

          try {
            const data = JSON.parse(sse.data);
            yield sse.event ? ({ event: sse.event, data } as unknown) : data;
          } catch (e) {
            console.error('Failed to parse JSON:', sse.data);
            throw e;
          }
        }
        done = true;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        throw e;
      } finally {
        if (!done) controller?.abort();
      }
    }

    return new StreamResponse(iterator(), controller);
  }

  static fromReadableStream(stream: ReadableStream, controller?: AbortController) {
    let consumed = false;
    controller = controller ?? new AbortController();

    async function* iterator(): AsyncGenerator<string> {
      if (consumed) throw new Error('Stream already consumed');
      consumed = true;
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        const reader = stream.getReader();
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) yield line;
          }
        }

        if (buffer.trim()) yield buffer;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        throw e;
      } finally {
        controller?.abort();
      }
    }

    return new StreamResponse(iterator(), controller);
  }

  [Symbol.asyncIterator](): AsyncIterator<Item> {
    return this.iterator;
  }

  toReadableStream(): ReadableStream {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    let iter: AsyncIterator<Item>;
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start() {
        iter = self[Symbol.asyncIterator]();
      },
      async pull(controller) {
        const { value, done } = await iter.next();
        if (done) return controller.close();
        controller.enqueue(encoder.encode(JSON.stringify(value) + '\n'));
      },
      async cancel() {
        await iter.return?.();
      },
    });
  }

  toResponse(init?: ResponseInit): Response {
    return new Response(this.toReadableStream(), {
      status: init?.status ?? 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...init?.headers,
      },
    });
  }
}

export async function* _iterSSEMessages(
  response: Response,
  controller?: AbortController
): AsyncGenerator<ServerSentEvent> {
  if (!response.body) {
    controller?.abort();
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = '';
  const sseDecoder = new SSEDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      for (const line of part.split('\n')) {
        const sse = sseDecoder.decode(line);
        if (sse) yield sse;
      }
      const sse = sseDecoder.decode('');
      if (sse) yield sse;
    }
  }

  if (buffer.trim()) {
    for (const line of buffer.split('\n')) {
      const sse = sseDecoder.decode(line);
      if (sse) yield sse;
    }
    const sse = sseDecoder.decode('');
    if (sse) yield sse;
  }
}

class SSEDecoder {
  private data: string[] = [];
  private event: string | null = null;
  private raw: string[] = [];

  decode(line: string): ServerSentEvent | null {
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (!line) {
      if (!this.data.length) return null;
      const event = {
        event: this.event,
        data: this.data.join('\n'),
        raw: this.raw,
      };
      this.data = [];
      this.event = null;
      this.raw = [];
      return event;
    }

    this.raw.push(line);

    if (line.startsWith(':')) return null;

    const [field, , valueRaw] = partition(line, ':');
    const value = valueRaw.startsWith(' ') ? valueRaw.slice(1) : valueRaw;

    if (field === 'event') this.event = value;
    else if (field === 'data') this.data.push(value);

    return null;
  }
}

function partition(str: string, delimiter: string): [string, string, string] {
  const index = str.indexOf(delimiter);
  return index === -1 ? [str, '', ''] : [str.slice(0, index), delimiter, str.slice(index + delimiter.length)];
}
