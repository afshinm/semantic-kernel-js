import { MapServiceProvider } from './MapServiceProvider';

class MyChatClient {
  complete() {
    throw new Error('Method not implemented.');
  }
}

describe('MapServiceProvider', () => {
  describe('addService', () => {
    it('should add a service', () => {
      // Arrange
      const serviceProvider = new MapServiceProvider();

      // Act
      serviceProvider.addService(new MyChatClient());

      // Assert
      expect(serviceProvider.getService(MyChatClient)).toBeDefined();
    });

    it('should not add the same serviceKey twice', () => {
      // Arrange
      const serviceProvider = new MapServiceProvider();
      const mockService = new MyChatClient();

      // Act
      serviceProvider.addService(mockService);

      // Assert
      expect(() => {
        serviceProvider.addService(mockService);
      }).toThrow('Service id "MyChatClient" is already registered.');
    });

    it('should add the same service with different service keys', () => {
      // Arrange
      const serviceProvider = new MapServiceProvider();
      const mockService = new MyChatClient();

      // Act
      serviceProvider.addService(mockService);
      serviceProvider.addService(mockService, { serviceId: 'MyChatClient2' });

      // Assert
      expect(serviceProvider.getServices(MyChatClient).size).toBe(2);
    });
  });
});
