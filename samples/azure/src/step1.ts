import { AzureOpenAIChatCompletionService } from '@semantic-kernel/azure-openai';
import { ChatMessageContent, kernel, KernelArguments, PromptExecutionSettings, StreamingTextContent } from "semantic-kernel";

const sk = kernel().addService(
    new AzureOpenAIChatCompletionService({
        deploymentName: '<OpenAI model name>',
        endpoint: '<Azure OpenAI endpoint>',
        apiVersion: '<OpenAPI version>'
    })
);

// Example 1 - Invoke the kernel with a prompt and display the result
async function simpleInvokePrompt(): Promise<string | undefined> {
    const result = await sk.invokePrompt({ promptTemplate: 'What color is the sky' });
    return (result?.value as ChatMessageContent)?.items[0]?.toString() ?? undefined;
}

// Example 2 - Invoke the kernel with a templated prompt and display the result
async function templateInvokePrompt(): Promise<string | undefined> {
    const args: KernelArguments = new KernelArguments({ 
        arguments: { topic: "sea" }, 
        executionSettings: undefined
    });

    const result = await sk.invokePrompt({ promptTemplate: 'What color is the {{topic}}', kernelArguments: args});
    return (result?.value as ChatMessageContent)?.items[0]?.toString() ?? undefined;
}

// Example 3 - Invoke the kernel with a templated prompt and stream the results
async function streamInvokePrompt(): Promise<void> {
    const args: KernelArguments = new KernelArguments({ 
        arguments: { topic: "sea" }, 
        executionSettings: undefined
    });
    async function streamPrompt() {
        const stream = sk.invokeStreamingPrompt({ promptTemplate: 'What color is the {{topic}}? Provide a detailed explanation.', kernelArguments: args });

        for await (const result of stream) {
            const res = (result as ChatMessageContent)?.items[0];
            if (res instanceof StreamingTextContent) {
                process.stdout.write((res as StreamingTextContent)?.text as string);
            }
        }
    }
    await streamPrompt();
    console.log();
}

// Example 4 - Invoke the kernel with a templated prompt and custom execution settings
async function customExecutionSettingsInvokePrompt(): Promise<string | undefined> {
    const promptSettings = {
        "maxTokens": 500,
        "temperature": 0.5,
    };
    const args: KernelArguments = new KernelArguments({
        arguments: { topic: "dogs" },
        executionSettings: promptSettings as PromptExecutionSettings,
    });
    const result = await sk.invokePrompt({ promptTemplate: 'Tell me a story about {{topic}}', kernelArguments: args});
    return (result?.value as ChatMessageContent)?.items[0]?.toString() ?? undefined;
}

// Example 5 - Invoke the kernel with a templated prompt and custom execution settings that return a JSON response
async function invokePromptWithJsonResponse(): Promise<string | undefined> {
    const promptSettings = {
        "reponseFormat": "json_object",
    };
    const args: KernelArguments = new KernelArguments({
        arguments: { topic: "chocolate" },
        executionSettings: promptSettings as PromptExecutionSettings,
    });
    const result = await sk.invokePrompt({ promptTemplate: 'Create a recipe for a {{topic}} cake in JSON format', kernelArguments: args});
    return (result?.value as ChatMessageContent)?.items[0]?.toString() ?? undefined;
}

async function runAllExamples() {
    console.log('Example 1:');
    console.log(await simpleInvokePrompt());
    console.log('Example 2:');
    console.log(await templateInvokePrompt());
    console.log('Example 3:');
    await streamInvokePrompt();
    console.log('Example 4:');
    console.log(await customExecutionSettingsInvokePrompt());
    console.log('Example 5:');
    console.log(await invokePromptWithJsonResponse());
}

runAllExamples().then(() => {});