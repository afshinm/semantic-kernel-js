import { OpenAIChatClient } from '@semantic-kernel/openai';
import { FunctionChoiceBehavior, functionInvocation, Kernel, kernelFunction } from 'semantic-kernel';

const openAIChatClient = new OpenAIChatClient({
  apiKey: 'YOUR_OPENAI_API_KEY',
  modelId: 'gpt-3.5-turbo',
})
  .asBuilder()
  // Enable FunctionInvocation
  .use(functionInvocation)
  .build();

const kernel = new Kernel().addService(openAIChatClient);

const encrypt = kernelFunction(({ msg }) => `** ${msg} **`, {
  description: 'Creates an encrypted message',
  name: 'encrypt',
  pluginName: 'encryptor',
  schema: {
    type: 'object',
    properties: {
      msg: { type: 'string', description: 'The raw message to encrypt' },
    },
  },
});

kernel.plugins.addPlugin({
  name: 'encryptor',
  description: 'Encryptor plugin',
  functions: [encrypt],
});

(async () => {
  const res = await kernel.invokePrompt(
    'Encrypt this raw input message "Hello World" then return the encrypted message',
    {
      executionSettings: {
        functionChoiceBehavior: FunctionChoiceBehavior.Auto(),
      },
    }
  );

  console.log(JSON.stringify(res));
})();
