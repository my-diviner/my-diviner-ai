import {
  assertEquals,
  awaitAllCallbacks,
  AzureChatOpenAI,
  AzureOpenAIEmbeddings,
} from '../test.deps.ts';

Deno.test('Basic Chain Tests', async (t) => {
  const model = new AzureChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    maxRetries: 5,
  });

  await t.step('Invoke Test', async () => {
    const res = await model.invoke(
      'Question: What would be a good company name for a company that makes colorful socks?\nAnswer:'
    );

    console.log({ res });
  });

  await t.step('Stream Test', async () => {
    model.streaming = true;
    
    const res = await model.stream(
      'Question: What would be a good company name for a company that makes colorful socks?\nAnswer:'
    );

    for await (const { content } of res) {
      console.log(content);
    }
  });

  await t.step('Embeddings Test', async () => {
    const model = new AzureOpenAIEmbeddings({
      azureOpenAIEmbeddingsApiDeploymentName: Deno.env.get('AZURE_OPENAI_API_EMBEDDING_DEPLOYMENT_NAME'),
      maxRetries: 5,
    });

    const res = await model.embedQuery(
      'Question: What would be a good company name for a company that makes colorful socks?\nAnswer:'
    );

    assertEquals(res.length, 1536);
  });

  await awaitAllCallbacks();
});
