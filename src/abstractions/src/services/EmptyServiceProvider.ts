import { ServiceProvider } from './ServiceProvider';

export class EmptyServiceProvider implements ServiceProvider {
  addService(): void {
    throw new Error('Method not implemented.');
  }
  trySelectAIService(): undefined {
    return undefined;
  }
}
