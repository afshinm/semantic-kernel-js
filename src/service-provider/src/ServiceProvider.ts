import { Service } from './Service';

export const defaultServiceId = 'default';

/**
 * Represents a service provider.
 */
export interface ServiceProvider {
  /**
   * Adds a service.
   * @param service The service to add.
   */
  addService(service: InstanceType<Service>, options?: { serviceId: string }): void;

  getService<T extends Service>(serviceType: T): InstanceType<T> | undefined;

  getServices<T extends Service>(serviceType: T): Map<string, InstanceType<T>>;
}
