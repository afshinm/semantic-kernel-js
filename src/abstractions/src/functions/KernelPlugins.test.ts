import { kernelFunction } from './KernelFunction';
import { MapKernelPlugins } from './KernelPlugins';

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

    it('should return all plugins', () => {
      // Arrange
      const mockKernelPlugins = new MapKernelPlugins();
      const mockPlugin1 = {
        name: 'testPlugin1',
        description: 'testDescription1',
        functions: [
          kernelFunction(() => 'testResult', {
            name: 'testFunction1',
          }),
          kernelFunction(() => 'testResult', {
            name: 'testFunction2',
          }),
        ],
      };
      const mockPlugin2 = {
        name: 'testPlugin2',
        description: 'testDescription2',
        functions: [
          kernelFunction(() => 'testResult', {
            name: 'testFunction1',
          }),
          kernelFunction(() => 'testResult', {
            name: 'testFunction2',
          }),
        ],
      };

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

  describe('addPlugin', () => {
    it('should add a plugin with multiple functions', () => {
      // Arrange
      const mockKernelPlugins = new MapKernelPlugins();

      // Act
      mockKernelPlugins.addPlugin({
        name: 'testPlugin',
        description: 'testDescription',
        functions: [
          kernelFunction(() => 'testResult', {
            name: 'testFunction1',
          }),
          kernelFunction(() => 'testResult', {
            name: 'testFunction2',
          }),
        ],
      });

      // Assert
      const plugins = [...mockKernelPlugins.getPlugins()];
      expect(plugins).toHaveLength(1);
      expect([...plugins][0].name).toEqual('testPlugin');
      expect([...plugins][0].functions.size).toBe(2);
    });

    it('should add a plugin with correct functions', () => {
      // Arrange
      const mockKernelPlugins = new MapKernelPlugins();

      // Act
      const fn1 = kernelFunction(() => 'testResult', {
        name: 'testFunction1',
        description: 'testDescription1',
        schema: { type: 'string' } as const,
      });

      const fn2 = kernelFunction(() => 'testResult', {
        name: 'testFunction2',
        description: 'testDescription2',
        schema: { type: 'number' } as const,
      });

      mockKernelPlugins.addPlugin({
        name: 'testPlugin',
        description: 'testDescription',
        functions: [fn1, fn2],
      });

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
      const mockKernelPlugins = new MapKernelPlugins();

      // Act
      // Assert
      expect(() => {
        mockKernelPlugins.addPlugin({
          name: 'testPlugin',
          description: 'testDescription',
          functions: [],
        });
      }).toThrow();
    });

    it('should not add the same plugin twice', () => {
      // Arrange
      const mockKernelPlugins = new MapKernelPlugins();
      const plugin = {
        name: 'testPlugin',
        description: 'testDescription',
        functions: [kernelFunction(() => 'testResult', { name: 'testFunction2' })],
      };

      // Act
      // Assert
      mockKernelPlugins.addPlugin(plugin);

      expect(() => {
        mockKernelPlugins.addPlugin(plugin);
      }).toThrow();
    });

    it('should set the correct pluginName to functions', () => {
      // Arrange
      const mockKernelPlugins = new MapKernelPlugins();

      // Act
      mockKernelPlugins.addPlugin({
        name: 'testPlugin',
        description: 'testDescription',
        functions: [
          kernelFunction(() => 'testResult', { name: 'testFunction1' }),
          kernelFunction(() => 'testResult', { name: 'testFunction2' }),
        ],
      });

      // Assert
      const firstPlugin = [...mockKernelPlugins.getPlugins()][0];
      const firstPluginFunctions = [...firstPlugin.functions.values()];
      expect(firstPluginFunctions.map((fn) => [fn.metadata?.name, fn.metadata?.pluginName])).toStrictEqual([
        ['testFunction1', 'testPlugin'],
        ['testFunction2', 'testPlugin'],
      ]);
    });
  });

  describe('getFunction', () => {
    it('should return the correct undefined when function is not found', () => {
      // Arrange
      const mockKernelPlugins = new MapKernelPlugins();

      // Act
      const result = mockKernelPlugins.getFunction('not-found');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return the undefined when pluginName is not defined', () => {
      // Arrange
      const stubPluginName = 'testPlugin';
      const stubFunctionName = 'testFunction1';
      const mockKernelPlugins = new MapKernelPlugins();
      mockKernelPlugins.addPlugin({
        name: stubPluginName,
        description: 'testDescription',
        functions: [
          kernelFunction(() => 'testResult', {
            name: stubFunctionName,
            schema: { type: 'string' } as const,
          }),
        ],
      });

      // Act
      const result = mockKernelPlugins.getFunction('testFunction1', 'not-found');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return the correct function with functionName', () => {
      // Arrange
      const stubPluginName = 'testPlugin';
      const stubFunctionName = 'testFunction1';
      const mockKernelPlugins = new MapKernelPlugins();
      mockKernelPlugins.addPlugin({
        name: stubPluginName,
        description: 'testDescription',
        functions: [
          kernelFunction(() => 'testResult', {
            name: stubFunctionName,
            schema: { type: 'string' } as const,
          }),
        ],
      });

      // Act
      const result = mockKernelPlugins.getFunction(stubFunctionName);

      // Assert
      expect(result?.metadata?.name).toBe(stubFunctionName);
    });

    it('should return the correct function with functionName and pluginName', () => {
      // Arrange
      const stubPluginName = 'testPlugin';
      const stubFunctionName = 'testFunction1';
      const mockKernelPlugins = new MapKernelPlugins();
      mockKernelPlugins.addPlugin({
        name: stubPluginName,
        description: 'testDescription',
        functions: [
          kernelFunction(() => 'testResult', {
            name: stubFunctionName,
            schema: { type: 'string' } as const,
          }),
        ],
      });

      // Act
      const result = mockKernelPlugins.getFunction(stubFunctionName);

      // Assert
      expect(result?.metadata?.name).toBe(stubFunctionName);
    });
  });

  describe('getFunctionsMetadata', () => {
    it('should return all functions metadata', () => {
      // Arrange
      const mockKernelPlugins = new MapKernelPlugins();
      const mockPlugin1 = {
        name: 'testPlugin1',
        description: 'testPluginDescription1',
        functions: [
          kernelFunction(() => 'testResult', {
            name: 'testFunction1',
            description: 'testDescription1',
            schema: { type: 'string' } as const,
          }),
          kernelFunction(() => 'testResult', {
            name: 'testFunction2',
            description: 'testDescription2',
            schema: { type: 'number' } as const,
          }),
        ],
      };
      const mockPlugin2 = {
        name: 'testPlugin2',
        description: 'testPluginDescription2',
        functions: [
          kernelFunction(() => 'testResult', {
            name: 'testFunction3',
            description: 'testDescription3',
            schema: { type: 'boolean' } as const,
          }),
          kernelFunction(() => 'testResult', {
            name: 'testFunction4',
            description: 'testDescription4',
            schema: { type: 'object' } as const,
          }),
        ],
      };

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
