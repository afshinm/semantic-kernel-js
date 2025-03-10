export {};

declare module '@semantic-kernel/service-provider' {
  export interface ServiceProvider {
    trySelectService<T extends Service>({
      serviceType,
      kernelFunction,
    }: {
      serviceType: T;
      kernelFunction?: KernelFunction;
    }):
      | {
          service: InstanceType<T>;
          executionSettings?: PromptExecutionSettings;
        }
      | undefined;
  }

  export interface MapServiceProvider {
    trySelectService<T extends Service>({
      serviceType,
      kernelFunction,
    }: {
      serviceType: T;
      kernelFunction?: KernelFunction;
    }):
      | {
          service: InstanceType<T>;
          executionSettings?: PromptExecutionSettings;
        }
      | undefined;
  }
}
