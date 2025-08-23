import { Kernel } from '../Kernel';
import { FunctionResult } from './FunctionResult';
import { KernelArguments } from './KernelArguments';
import { KernelFunction, kernelFunction } from './KernelFunction';

describe('kernelFunction', () => {
  describe('creating', () => {
    it('should create a kernel function with no params', () => {
      // Arrange
      const fn = () => 'testResult';
      const metadata = {
        name: 'testFunction',
        parameters: {},
      };

      // Act
      const result = kernelFunction(fn, metadata);

      // Assert
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('invoke', () => {
    let sk: Kernel;

    beforeEach(() => {
      sk = new Kernel();
    });

    it('should invoke a function with no params', async () => {
      // Arrange
      const metadata = {
        name: 'testFunction',
      };
      const fn = kernelFunction(() => 'testResult', metadata);

      // Act
      const result = await fn.invoke(sk);

      // Assert
      expect(result).toEqual({
        function: fn,
        value: 'testResult',
      });
    });

    it('should invoke a function with non-object one param', async () => {
      // Arrange
      const kernelArguments = new KernelArguments('testValue');

      // Act
      const result = await kernelFunction((value) => `**${value}**`, {
        name: 'testFunction',
        schema: {
          type: 'string',
        } as const,
      }).invoke(sk, kernelArguments);

      kernelFunction((value) => `**${value}**`, {
        name: 'testFunction',
      });

      // Assert
      expect(result.value).toEqual('**testValue**');
    });

    it('should invoke a function with one param', async () => {
      // Arrange
      const kernelArguments = new KernelArguments({ value: 'testValue' });

      // Act
      const result = await kernelFunction(({ value }) => `**${value}**`, {
        name: 'testFunction',
        schema: {
          type: 'object',
          properties: {
            value: {
              type: 'string',
            },
          },
          required: ['value'],
        } as const,
      }).invoke(sk, kernelArguments);

      // Assert
      expect(result.value).toEqual('**testValue**');
    });

    it('should invoke a function with two optional params', async () => {
      // Arrange
      const kernelArguments = new KernelArguments({});

      // Act
      const result = await kernelFunction(({ p1, p2 }) => `**${p1 ?? 'first'} ${p2 ?? 'second'}**`, {
        name: 'testFunction',
        schema: {
          type: 'object',
          properties: {
            p1: {
              type: 'string',
            },
            p2: {
              type: 'string',
            },
          },
        },
      }).invoke(sk, kernelArguments);

      // Assert
      expect(result.value).toEqual('**first second**');
    });

    it('should invoke a function with one required and one optional property', async () => {
      // Arrange
      const props = new KernelArguments({ p1: 'hello' });

      // Act
      const result = await kernelFunction(({ p1, p2 }) => `**${p1} ${p2}**`, {
        name: 'testFunction',
        schema: {
          type: 'object',
          properties: {
            p1: {
              type: 'string',
            },
            p2: {
              type: 'string',
            },
          },
          required: ['p1'],
        } as const,
      }).invoke(sk, props);

      // Assert
      expect(result.value).toEqual('**hello undefined**');
    });

    it('should invoke a function with required mixed string and number datatypes', async () => {
      // Arrange
      const props = new KernelArguments({ p1: 'hello', p2: 42 });

      // Act
      const result = await kernelFunction(({ p1, p2 }) => `**${p1} ${p2}**`, {
        name: 'testFunction',
        schema: {
          type: 'object',
          properties: {
            p1: {
              type: 'string',
            },
            p2: {
              type: 'number',
            },
          },
          required: ['p1', 'p2'],
        } as const,
      }).invoke(sk, props);

      // Assert
      expect(result.value).toEqual('**hello 42**');
    });

    it('should invoke a function with mixed optional number datatypes', async () => {
      // Arrange
      const props = new KernelArguments({ p1: 41, p2: 42 });

      // Act
      const result = await kernelFunction(({ p1, p2 }) => Math.min(p1 ?? 0, p2 ?? 0), {
        name: 'testFunction',
        schema: {
          type: 'object',
          properties: {
            p1: {
              type: 'number',
            },
            p2: {
              type: 'number',
            },
          },
        },
      }).invoke(sk, props);

      // Assert
      expect(result.value).toEqual(41);
    });

    it('should invoke a function with nested parameters', async () => {
      // Arrange
      const props = new KernelArguments({ p1: 41, nested_p1: { p2: 42 } });

      // Act
      const result = await kernelFunction(({ p1, nested_p1 }) => Math.max(p1, nested_p1.p2), {
        name: 'testFunction',
        schema: {
          type: 'object',
          properties: {
            p1: {
              type: 'number',
            },
            nested_p1: {
              type: 'object',
              properties: {
                p2: {
                  type: 'number',
                },
              },
              required: ['p2'],
              additionalProperties: false,
            },
          },
          required: ['p1', 'nested_p1'],
          additionalProperties: false,
        } as const,
      }).invoke(sk, props);

      // Assert
      expect(result.value).toEqual(42);
    });

    it('should invoke a streaming function with one param', async () => {
      // Arrange
      const kernelArguments = new KernelArguments({ value: 'testValue' });

      class StreamingKernelFunction extends KernelFunction {
        override invokeCore(): Promise<FunctionResult> {
          throw new Error('Method not implemented.');
        }

        // Override to simulate streaming
        override async *invokeStreamingCore<T>(_kernel: Kernel, args: KernelArguments): AsyncGenerator<T> {
          const val = args.arguments ? (args.arguments as { value: string }).value : '';
          for (const char of val) {
            // simulate some async operation
            await new Promise((resolve) => setTimeout(resolve, 1));
            yield char as unknown as T;
          }
        }
      }

      const fn = new StreamingKernelFunction({
        name: 'streamingTestFunction',
        schema: {
          type: 'object',
          properties: {
            value: {
              type: 'string',
            },
          },
          required: ['value'],
        } as const,
      });

      // Act
      const chunks: string[] = [];
      for await (const chunk of fn.invokeStreaming(sk, kernelArguments)) {
        chunks.push(chunk as string);
      }

      // Assert
      expect(chunks).toEqual(['t', 'e', 's', 't', 'V', 'a', 'l', 'u', 'e']);
    });
  });

  describe('functionInvocationFilters', () => {
    it('should call functionInvocationFilters', async () => {
      // Arrange
      const fn = () => 'testResult';
      const metadata = {
        name: 'testFunction',
        parameters: {},
      };
      const sk = new Kernel();
      const filterCallsHistory: number[] = [];

      sk.useFunctionInvocation(async (context, next) => {
        filterCallsHistory.push(Date.now());
        await next(context);
      });

      sk.useFunctionInvocation(async (context, next) => {
        filterCallsHistory.push(Date.now() + 5);
        await next(context);
      });

      // Act
      await kernelFunction(fn, metadata).invoke(sk);

      // Assert
      expect(filterCallsHistory).toHaveLength(2);
      expect(filterCallsHistory[0]).toBeLessThan(filterCallsHistory[1]);
    });

    it('should recognize the parameters in the context', async () => {
      // Arrange
      const sk = new Kernel();
      const fn = kernelFunction(({ p1 }) => `**${p1}**`, {
        name: 'testFunction',
        schema: {
          type: 'object',
          properties: {
            p1: {
              type: 'string',
            },
          },
          required: ['p1'],
        } as const,
      });

      sk.useFunctionInvocation(async (context, next) => {
        await next(context);
        const args = context.arguments.arguments as { p1: string };
        context.result.value = `***${args.p1}***`;
      });

      // Act
      const result = await fn.invoke(sk, new KernelArguments({ p1: 'testValue' }));

      // Assert
      expect(result.value).toEqual('***testValue***');
    });

    it('should be able to override the function result', async () => {
      // Arrange
      const sk = new Kernel();
      const fn = kernelFunction(() => 'testResult', {
        name: 'testFunction',
      });

      sk.useFunctionInvocation(async (context, next) => {
        await next(context);
        context.result.value = 'overriddenResult';
      });

      // Act
      const result = await fn.invoke(sk);

      // Assert
      expect(result.value).toEqual('overriddenResult');
    });

    it('should not override the function result before calling next', async () => {
      // Arrange
      const sk = new Kernel();
      const fn = kernelFunction(() => 'testResult', {
        name: 'testFunction',
      });

      sk.useFunctionInvocation(async (context, next) => {
        context.result.value = 'overriddenResult';
        await next(context);
      });

      // Act
      const result = await fn.invoke(sk);

      // Assert
      expect(result.value).toEqual('testResult');
    });

    it('should not run function if filter does not call next', async () => {
      // Arrange
      const sk = new Kernel();
      const fn = kernelFunction(() => 'testResult', {
        name: 'testFunction',
      });

      sk.useFunctionInvocation(async () => {
        // Do not call next
      });

      // Act
      const result = await fn.invoke(sk);

      // Assert
      expect(result.value).toBeUndefined();
    });

    it('should pass the kernel instance in the context', async () => {
      // Arrange
      const sk = new Kernel();
      const fn = kernelFunction(() => 'testResult', {
        name: 'testFunction',
      });

      let contextKernel: Kernel | undefined;
      sk.useFunctionInvocation(async (context, next) => {
        contextKernel = context.kernel;
        await next(context);
      });

      // Act
      await fn.invoke(sk);

      // Assert
      expect(contextKernel).toBe(sk);
    });

    it('should call functionInvocationFilters for streaming functions', async () => {
      // Arrange
      const sk = new Kernel();
      const filterCallsHistory: number[] = [];

      sk.useFunctionInvocation(async (context, next) => {
        filterCallsHistory.push(Date.now());
        await next(context);
      });

      sk.useFunctionInvocation(async (context, next) => {
        filterCallsHistory.push(Date.now() + 5);
        await next(context);
      });

      class StreamingKernelFunction extends KernelFunction {
        override invokeCore(): Promise<FunctionResult> {
          throw new Error('Method not implemented.');
        }

        // Override to simulate streaming
        override async *invokeStreamingCore<T>(_kernel: Kernel, args: KernelArguments): AsyncGenerator<T> {
          const val = args.arguments ? (args.arguments as { value: string }).value : '';
          for (const char of val) {
            // simulate some async operation
            await new Promise((resolve) => setTimeout(resolve, 1));
            yield char as unknown as T;
          }
        }
      }

      const fn = new StreamingKernelFunction({
        name: 'streamingTestFunction',
        schema: {
          type: 'object',
          properties: {
            value: {
              type: 'string',
            },
          },
          required: ['value'],
        } as const,
      });

      // Act
      const chunks: string[] = [];
      for await (const chunk of fn.invokeStreaming(sk, new KernelArguments({ value: 'testValue' }))) {
        chunks.push(chunk as string);
      }

      // Assert
      expect(chunks).toEqual(['t', 'e', 's', 't', 'V', 'a', 'l', 'u', 'e']);
      expect(filterCallsHistory).toHaveLength(2);
      expect(filterCallsHistory[0]).toBeLessThan(filterCallsHistory[1]);
    });
  });
});
