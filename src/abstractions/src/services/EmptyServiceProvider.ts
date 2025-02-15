import { Constructor, ServiceProvider } from './ServiceProvider';

export class EmptyServiceProvider implements ServiceProvider {
  getService<T extends Constructor>(): InstanceType<T> {
    throw new Error('Method not implemented.');
  }
  addService(): void {
    throw new Error('Method not implemented.');
  }
  trySelectChatClient(): undefined {
    return undefined;
  }
}
