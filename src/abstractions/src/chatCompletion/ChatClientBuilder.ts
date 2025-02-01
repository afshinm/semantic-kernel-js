import { ServiceProvider } from '../services';
import { EmptyServiceProvider } from '../services/EmptyServiceProvider';
import { ChatClient } from './ChatClient';

export class ChatClientBuilder {
  private readonly _innerClientFactory: (serviceProvider: ServiceProvider) => ChatClient;
  private _clientFactories?: ((chatClient: ChatClient, serviceProvider: ServiceProvider) => ChatClient)[];

  constructor({
    innerClient,
    innerClientFactory,
  }: {
    innerClient?: ChatClient;
    innerClientFactory?: (serviceProvider: ServiceProvider) => ChatClient;
  }) {
    if (!innerClient && !innerClientFactory) {
      throw new Error('Either innerClient or innerClientFactory must be provided');
    }

    if (innerClientFactory) {
      this._innerClientFactory = innerClientFactory;
    } else {
      this._innerClientFactory = () => innerClient as ChatClient;
    }
  }

  build(serviceProvider?: ServiceProvider): ChatClient {
    serviceProvider ??= new EmptyServiceProvider();

    let chatClient = this._innerClientFactory(serviceProvider);

    if (this._clientFactories) {
      for (let i = this._clientFactories.length - 1; i >= 0; i--) {
        chatClient =
          this._clientFactories[i](chatClient, serviceProvider) ??
          new Error(
            `The ChatClientBuilder entry at index ${i} returned null. Ensure that the callbacks passed to Use return non-null ChatClient instances.`
          );
      }
    }

    return chatClient;
  }

  use(clientFactory: (chatClient: ChatClient, serviceProvider?: ServiceProvider) => ChatClient) {
    (this._clientFactories ??= []).push(clientFactory);
    return this;
  }
}
