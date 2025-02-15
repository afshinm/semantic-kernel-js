import { defaultServiceId } from '../AI';
import { ChatClient, ChatOptions } from '../chatCompletion';
import { KernelFunction } from '../functions';


// import { getServiceModelId } from './AIService';

type Constructor = abstract new (...args: unknown[]) => unknown;

/**
 * Represents a service provider.
 */
export interface ServiceProvider {
  /**
   * Adds a service.
   * @param service The service to add.
   */
  addService(service: object): void;

  getService<T extends Constructor>(serviceType: T): InstanceType<T>;

  /**
   * Get service of a specific type.
   * @param params Parameters for getting the service.
   * @param params.serviceType The type of service to get.
   * @param params.executionSettings Execution settings for the service.
   */
  trySelectChatClient(params: {
    kernelFunction?: KernelFunction;
  }):
    | {
        chatClient: ChatClient;
        chatOptions?: ChatOptions;
      }
    | undefined;
}

/**
 * Represents a service provider that uses a map to store services.
 */
export class MapServiceProvider implements ServiceProvider {
  getService<T extends Constructor>(serviceType: T): InstanceType<T> {
    return this.getServicesByType(serviceType)[0];
  }

  private readonly services: Map<string, object> = new Map();

  addService(service: object) {
    const serviceId = this.getServiceId(service);

    if (this.hasService(serviceId)) {
      throw new Error(`Service id "${serviceId}" is already registered.`);
    }

    this.services.set(serviceId, service);
  }

  trySelectChatClient({ kernelFunction }: { kernelFunction?: KernelFunction }) {
    const chatOptionsMapping = kernelFunction?.metadata?.chatOptions;
    const chatClients = this.getServicesByType(ChatClient);

    if (!chatClients.length) {
      return undefined;
    }

    if (!chatOptionsMapping || chatOptionsMapping.size === 0) {
      // return the first service if no execution settings are provided
      return {
        chatClient: chatClients[0],
        chatOptions: undefined,
      };
    }

    let defaultChatOptions: ChatOptions | undefined;

    // search by service id first
    for (const [serviceId, chatOptions] of chatOptionsMapping) {
      if (!serviceId || serviceId === defaultServiceId) {
        defaultChatOptions = chatOptions;
      }

      const chatClient = chatClients.find((s) => this.getServiceId(s) === serviceId);
      if (chatClient) {
        return {
          chatClient,
          chatOptions,
        };
      }
    }

    // search by model id next
    for (const chatOptions of chatOptionsMapping.values()) {
      const modelId = chatOptions.modelId;
      const chatClient = chatClients.find((s) => s.metadata.modelId === modelId);
      if (chatClient) {
        return {
          chatClient,
          chatOptions,
        };
      }
    }

    // search by default service id last
    if (defaultChatOptions) {
      return {
        chatClient: chatClients[0],
        chatOptions: defaultChatOptions,
      };
    }

    return undefined;
  }

  private getServiceId(service: object) {
    return service.constructor.name;
  }

  private hasService(serviceKey: string) {
    return this.services.has(serviceKey);
  }

  private getServicesByType<T extends Constructor>(serviceType: T) {
    return Array.from(this.services.values()).filter((service) => service instanceof serviceType) as InstanceType<T>[];
  }
}
