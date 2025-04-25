import { ChatClientBuilder } from './ChatClientBuilder';

describe('ChatClientBuilder', () => {
  it('should throw an error if neither innerClient nor innerClientFactory is provided', () => {
    expect(() => new ChatClientBuilder({})).toThrowError('Either innerClient or innerClientFactory must be provided');
  });
});
