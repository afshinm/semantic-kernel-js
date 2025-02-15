import { ServiceProvider } from './ServiceProvider';

export class EmptyServiceProvider implements ServiceProvider {
  getService(): object {
    throw new Error('Method not implemented.');
  }
  addService(): void {
    throw new Error('Method not implemented.');
  }
  trySelectAIService(): undefined {
    return undefined;
  }
}
