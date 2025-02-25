import { ServiceProvider } from './ServiceProvider';

export class EmptyServiceProvider implements ServiceProvider {
  getService(): undefined {
    throw new Error('Method not implemented.');
  }
  addService(): void {
    throw new Error('Method not implemented.');
  }
  trySelectService(): undefined {
    return undefined;
  }
}
