import { Service, ServiceProvider } from './ServiceProvider';

export class EmptyServiceProvider implements ServiceProvider {
  getService<T extends Service>(): InstanceType<T> {
    throw new Error('Method not implemented.');
  }
  addService(): void {
    throw new Error('Method not implemented.');
  }
  trySelectService(): undefined {
    return undefined;
  }
}
