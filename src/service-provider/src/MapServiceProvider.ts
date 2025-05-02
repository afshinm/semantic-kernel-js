import { Service } from './Service';
import { ServiceProvider, defaultServiceId } from './ServiceProvider';

/**
 * Represents a service provider that uses a map to store services.
 */
export class MapServiceProvider implements ServiceProvider {
  private readonly services: Map<string, InstanceType<Service>> = new Map();

  getServices<T extends Service>(serviceType: T) {
    return this.getServicesByType(serviceType);
  }

  getService<T extends Service>(serviceType: T): InstanceType<T> | undefined {
    const servicesByType = this.getServicesByType(serviceType);
    if (servicesByType.size > 0) {
      return servicesByType.values().next().value;
    }
  }

  addService(service: InstanceType<Service>, options?: { serviceId: string }) {
    let serviceId = defaultServiceId;
    if (options?.serviceId) {
      serviceId = options.serviceId;
    } else if (service?.constructor?.name) {
      serviceId = service.constructor.name;
    }

    if (this.services.has(serviceId)) {
      throw new Error(`Service id "${serviceId}" is already registered.`);
    }

    this.services.set(serviceId, service);
  }

  protected getServicesByType<T extends Service>(serviceType: T): Map<string, InstanceType<T>> {
    return new Map(Array.from(this.services.entries()).filter(([, service]) => service instanceof serviceType)) as Map<
      string,
      InstanceType<T>
    >;
  }
}
