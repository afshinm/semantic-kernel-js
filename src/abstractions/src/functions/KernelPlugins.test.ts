import { type JsonSchema } from '@semantic-kernel/ai';
import { type KernelFunction, kernelFunction } from './KernelFunction';
import { type KernelPlugin } from './KernelPlugin';
import { MapKernelPlugins } from './KernelPlugins';

const getMockFunction = (functionName?: string, functionDescription?: string, schema?: JsonSchema) => {
  return kernelFunction(() => 'testResult', {
    name: functionName ?? 'testFunction',
    description: functionDescription ?? 'testDescription',
    schema: schema,
  });
};

const getMockPlugin = (
  pluginFunctions: KernelFunction[],
  pluginName?: string,
  pluginDescription?: string
): KernelPlugin => {
  return {
    name: pluginName ?? 'testPlugin',
    description: pluginDescription ?? 'testDescription',
    functions: pluginFunctions,
  };
};

const getMockKernelPlugins = () => new MapKernelPlugins();

describe('kernelPlugins', () => {
  describe('getPlugins', () => {
    it('should return an object with the correct properties', () => {
      // Arrange
      const kernelPlugins = new MapKernelPlugins();

      // Act
      const plugins = [...kernelPlugins.getPlugins()];

      // Assert
      expect(plugins).toHaveLength(0);
    });
  });

  describe('getFunctionsMetadata', () => {
    it('should return all functions metadata', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();

      // Act
      mockKernelPlugins.addPlugin(
        getMockPlugin([
          kernelFunction(() => 'testResult', {
            name: 'testFunction',
            description: 'testDescription',
            schema: { type: 'string' } as const,
          }),
          getMockFunction('testFunction1', 'testDescription1', { type: 'string' } as const),
          getMockFunction('testFunction2', 'testDescription2', { type: 'number' } as const),
        ])
      );

      // Assert
      expect(mockKernelPlugins.getFunctionsMetadata()).toEqual([
        {
          name: 'testFunction1',
          description: 'testDescription1',
          pluginName: 'testPlugin',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'testFunction2',
          description: 'testDescription2',
          pluginName: 'testPlugin',
          schema: {
            type: 'number',
          },
        },
      ]);
    });
  });

  describe('addPlugin', () => {
    it('should add a plugin', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();

      // Act
      mockKernelPlugins.addPlugin(getMockPlugin([getMockFunction('testFunction1'), getMockFunction('testFunction2')]));

      // Assert
      const plugins = [...mockKernelPlugins.getPlugins()];
      expect(plugins).toHaveLength(1);
      expect([...plugins][0].name).toEqual('testPlugin');
    });

    it('should add a plugin with correct functions', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();

      // Act
      mockKernelPlugins.addPlugin(
        getMockPlugin([
          getMockFunction('testFunction1', 'testDescription1', { type: 'string' }),
          getMockFunction('testFunction2', 'testDescription2', { type: 'number' }),
        ])
      );

      // Assert
      const plugins = [...mockKernelPlugins.getPlugins()];
      const firstPlugin = plugins[0];
      expect([...firstPlugin.functions.entries()]).toHaveLength(2);
      expect(firstPlugin.functions.get('testFunction1')?.metadata).toStrictEqual({
        name: 'testFunction1',
        description: 'testDescription1',
        pluginName: 'testPlugin',
        schema: { type: 'string' },
      });
      expect(firstPlugin.functions.get('testFunction2')?.metadata).toStrictEqual({
        name: 'testFunction2',
        description: 'testDescription2',
        pluginName: 'testPlugin',
        schema: { type: 'number' },
      });
    });

    it('should not add plugin without functions', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();

      // Act
      // Assert
      expect(() => {
        mockKernelPlugins.addPlugin(getMockPlugin([], 'testPlugin'));
      }).toThrow();
    });

    it('should not add the same plugin twice', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();

      // Act
      // Assert
      mockKernelPlugins.addPlugin(
        getMockPlugin([getMockFunction('testFunction2', 'testDescription2', { type: 'number' })], 'testPlugin')
      );

      expect(() => {
        mockKernelPlugins.addPlugin(
          getMockPlugin([getMockFunction('testFunction2', 'testDescription2', { type: 'number' })], 'testPlugin')
        );
      }).toThrow();
    });

    it('should set the correct pluginName to functions', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();

      // Act
      mockKernelPlugins.addPlugin(getMockPlugin([getMockFunction('testFunction1'), getMockFunction('testFunction2')]));

      // Assert
      const firstPlugin = [...mockKernelPlugins.getPlugins()][0];
      const firstPluginFunctions = [...firstPlugin.functions.values()];
      expect(firstPluginFunctions.map((fn) => [fn.metadata?.name, fn.metadata?.pluginName])).toStrictEqual([
        ['testFunction1', 'testPlugin'],
        ['testFunction2', 'testPlugin'],
      ]);
    });
  });

  describe('getPlugins', () => {
    it('should return all plugins', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();
      const mockPlugin1 = getMockPlugin(
        [getMockFunction('testFunction1'), getMockFunction('testFunction2')],
        'testPlugin1',
        'testDescription1'
      );
      const mockPlugin2 = getMockPlugin(
        [getMockFunction('testFunction1'), getMockFunction('testFunction2')],
        'testPlugin2',
        'testDescription2'
      );

      mockKernelPlugins.addPlugin(mockPlugin1);
      mockKernelPlugins.addPlugin(mockPlugin2);

      // Act
      const plugins = [...mockKernelPlugins.getPlugins()];

      // Assert
      expect(plugins).toHaveLength(2);
      expect(plugins[0].name).toBe('testPlugin1');
      expect(plugins[0].description).toBe('testDescription1');
      expect(plugins[1].name).toBe('testPlugin2');
      expect(plugins[1].description).toBe('testDescription2');
    });
  });

  describe('getFunction', () => {
    it('should return the correct undefined when function is not found', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();

      // Act
      const result = mockKernelPlugins.getFunction('not-found');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return the undefined when pluginName is not defined', () => {
      // Arrange
      const stubPluginName = 'testPlugin';
      const stubFunctionName = 'testFunction1';
      const mockKernelPlugins = getMockKernelPlugins();
      mockKernelPlugins.addPlugin(getMockPlugin([getMockFunction(stubFunctionName)], stubPluginName));

      // Act
      const result = mockKernelPlugins.getFunction('testFunction1', 'not-found');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return the correct function with functionName', () => {
      // Arrange
      const stubPluginName = 'testPlugin';
      const stubFunctionName = 'testFunction1';
      const mockKernelPlugins = getMockKernelPlugins();
      mockKernelPlugins.addPlugin(getMockPlugin([getMockFunction(stubFunctionName)], stubPluginName));

      // Act
      const result = mockKernelPlugins.getFunction(stubFunctionName);

      // Assert
      expect(result?.metadata?.name).toBe(stubFunctionName);
    });

    it('should return the correct function with functionName and pluginName', () => {
      // Arrange
      const stubPluginName = 'testPlugin';
      const stubFunctionName = 'testFunction1';
      const mockKernelPlugins = getMockKernelPlugins();
      mockKernelPlugins.addPlugin(getMockPlugin([getMockFunction(stubFunctionName)], stubPluginName));

      // Act
      const result = mockKernelPlugins.getFunction(stubFunctionName);

      // Assert
      expect(result?.metadata?.name).toBe(stubFunctionName);
    });
  });

  describe('getFunctionsMetadata', () => {
    it('should return all functions metadata', () => {
      // Arrange
      const mockKernelPlugins = getMockKernelPlugins();
      const mockPlugin1 = getMockPlugin(
        [
          getMockFunction('testFunction1', 'testDescription1', { type: 'string' }),
          getMockFunction('testFunction2', 'testDescription2', { type: 'number' }),
        ],
        'testPlugin1',
        'testPluginDescription1'
      );
      const mockPlugin2 = getMockPlugin(
        [
          getMockFunction('testFunction3', 'testDescription3', { type: 'boolean' }),
          getMockFunction('testFunction4', 'testDescription4', { type: 'object' }),
        ],
        'testPlugin2',
        'testPluginDescription2'
      );

      mockKernelPlugins.addPlugin(mockPlugin1);
      mockKernelPlugins.addPlugin(mockPlugin2);

      // Act
      const functionsMetadata = mockKernelPlugins.getFunctionsMetadata();

      // Assert
      expect(functionsMetadata).toHaveLength(4);
      expect(functionsMetadata).toEqual([
        {
          name: 'testFunction1',
          description: 'testDescription1',
          pluginName: 'testPlugin1',
          schema: { type: 'string' },
        },
        {
          name: 'testFunction2',
          description: 'testDescription2',
          pluginName: 'testPlugin1',
          schema: { type: 'number' },
        },
        {
          name: 'testFunction3',
          description: 'testDescription3',
          pluginName: 'testPlugin2',
          schema: { type: 'boolean' },
        },
        {
          name: 'testFunction4',
          description: 'testDescription4',
          pluginName: 'testPlugin2',
          schema: { type: 'object' },
        },
      ]);
    });
  });
});
