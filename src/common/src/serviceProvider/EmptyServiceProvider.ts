import { Service } from './Service';
import { ServiceProvider } from './ServiceProvider';

export class EmptyServiceProvider implements ServiceProvider {
  getService(): undefined {
    throw new Error('Method not implemented.');
  }
  getServices<T extends Service>(): Map<string, InstanceType<T>> {
    throw new Error('Method not implemented.');
  }
  addService(): void {
    throw new Error('Method not implemented.');
  }
  trySelectService(): undefined {
    return undefined;
  }
}
