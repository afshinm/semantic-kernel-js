import { Kernel } from '../Kernel';
import { KernelArguments } from './KernelArguments';
import { kernelFunction } from './KernelFunction';

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
  });

  // describe('functionInvocationFilters', () => {
  //   it('should call functionInvocationFilters', async () => {
  //     // Arrange
  //     const fn = () => 'testResult';
  //     const metadata = {
  //       name: 'testFunction',
  //       parameters: {},
  //     };
  //     const sk = new Kernel();
  //     const filterCallsHistory: number[] = [];

  //     sk.functionInvocationFilters.push({
  //       onFunctionInvocationFilter: async ({ context, next }) => {
  //         filterCallsHistory.push(Date.now());
  //         await next(context);
  //       },
  //     });
  //     sk.functionInvocationFilters.push({
  //       onFunctionInvocationFilter: async ({ context, next }) => {
  //         filterCallsHistory.push(Date.now() + 5);
  //         await next(context);
  //       },
  //     });

  //     // Act
  //     await kernelFunction(fn, metadata).invoke(sk);

  //     // Assert
  //     expect(filterCallsHistory).toHaveLength(2);
  //     expect(filterCallsHistory[0]).toBeLessThan(filterCallsHistory[1]);
  //   });
  // });
});
