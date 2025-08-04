import { MapServiceProvider, Service, defaultServiceId } from '@semantic-kernel/service-provider';
import { KernelFunction } from './functions';
import { PromptExecutionSettings } from './promptExecutionSettings';

MapServiceProvider.prototype.trySelectService = function <T extends Service>({
  serviceType,
  kernelFunction,
}: {
  serviceType: T;
  kernelFunction?: KernelFunction;
}) {
  const executionSettings = kernelFunction?.executionSettings;
  const services = this.getServices(serviceType);

  if (!services.size) {
    return undefined;
  }

  if (!executionSettings || executionSettings.size === 0) {
    // return the first service if no execution settings are provided
    return {
      service: services.values().next().value as InstanceType<T>,
      executionSettings: undefined,
    };
  }

  let defaultExecutionSettings: PromptExecutionSettings | undefined;

  // search by service id first
  for (const [serviceId, _executionSettings] of executionSettings) {
    if (!serviceId || serviceId === defaultServiceId) {
      defaultExecutionSettings = _executionSettings;
    }

    const service = services.get(serviceId);
    if (service) {
      return {
        service: service,
        executionSettings: _executionSettings,
      };
    }
  }

  // search by model id next
  for (const _executionSettings of executionSettings.values()) {
    const modelId = _executionSettings.modelId;
    const service = Array.from(services.values()).find((s) => getServiceModelId(s) === modelId);
    if (service) {
      return {
        service: service,
        executionSettings: _executionSettings,
      };
    }
  }

  // search by default service id last
  if (defaultExecutionSettings) {
    return {
      service: services.values().next().value as InstanceType<T>,
      executionSettings: defaultExecutionSettings,
    };
  }

  return undefined;
};

const getServiceModelId = function <T extends Service>(service: InstanceType<T>): string | undefined {
  // TODO: Improve this to avoid hardcoded `metadata` and `modelId` lookups
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
};
