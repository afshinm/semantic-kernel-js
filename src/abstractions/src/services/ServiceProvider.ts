import { PromptExecutionSettings, defaultServiceId } from '../AI';
import { KernelFunction } from '../functions';


export type Service = abstract new (...args: unknown[]) => unknown;

/**
 * Represents a service provider.
 */
export interface ServiceProvider {
  /**
   * Adds a service.
   * @param service The service to add.
   */
  addService(service: Service): void;

  getService<T extends Service>(serviceType: T): InstanceType<T>;

  /**
   * Get service of a specific type.
   * @param params Parameters for getting the service.
   * @param params.serviceType The type of service to get.
   * @param params.executionSettings Execution settings for the service.
   */
  trySelectService<T extends Service>({
    serviceType,
    kernelFunction,
  }: {
    serviceType: T;
    kernelFunction?: KernelFunction;
  }): {
    service: InstanceType<T>;
    executionSettings?: PromptExecutionSettings;
  } | undefined;
}

/**
 * Represents a service provider that uses a map to store services.
 */
export class MapServiceProvider implements ServiceProvider {
  getService<T extends Service>(serviceType: T): InstanceType<T> {
    return this.getServicesByType(serviceType)[0].service;
  }

  private readonly services: Map<string, object> = new Map();

  addService(
    service:
      | Service
      | {
          service: Service;
          serviceId: string;
        }
  ) {
    let serviceId = defaultServiceId;
    if ('serviceId' in service) {
      serviceId = service.serviceId;
      service = service.service;
    }

    if (this.services.has(serviceId)) {
      throw new Error(`Service id "${serviceId}" is already registered.`);
    }

    this.services.set(serviceId, service);
  }

  trySelectService<T extends Service>({
    serviceType,
    kernelFunction,
  }: {
    serviceType: T;
    kernelFunction?: KernelFunction;
  }) {
    const executionSettings = kernelFunction?.metadata?.executionSettings;
    const services = this.getServicesByType(serviceType);

    if (!services.length) {
      return undefined;
    }

    if (!executionSettings || executionSettings.size === 0) {
      // return the first service if no execution settings are provided
      return {
        service: services[0].service,
        executionSettings: undefined,
      };
    }

    let defaultExecutionSettings: PromptExecutionSettings | undefined;

    // search by service id first
    for (const [serviceId, _executionSettings] of executionSettings) {
      if (!serviceId || serviceId === defaultServiceId) {
        defaultExecutionSettings = _executionSettings;
      }

      const service = services.find((s) => s.serviceId === serviceId);
      if (service) {
        return {
          service: service.service,
          executionSettings: _executionSettings,
        };
      }
    }

    // search by model id next
    for (const _executionSettings of executionSettings.values()) {
      const modelId = _executionSettings.modelId;
      const service = services.find((s) => this.getServiceModelId(s.service) === modelId);
      if (service) {
        return {
          service: service.service,
          executionSettings: _executionSettings,
        };
      }
    }

    // search by default service id last
    if (defaultExecutionSettings) {
      return {
        service: services[0].service,
        executionSettings: defaultExecutionSettings,
      };
    }

    return undefined;
  }

  private getServiceModelId<T extends Service>(service: InstanceType<T>): string | undefined {
    if (
      service &&
      typeof service === 'object' &&
      'metadata' in service &&
      service.metadata instanceof Object &&
      'modelId' in service.metadata &&
      typeof service.metadata.modelId === 'string'
    ) {
      return service.metadata.modelId;
    }
  }

  private getServicesByType<T extends Service>(serviceType: T) {
    return Array.from(this.services.entries())
      .filter(([, service]) => service instanceof serviceType)
      .map(([serviceId, service]) => {
        return {
          service: service as InstanceType<T>,
          serviceId,
        };
      });
  }
}
