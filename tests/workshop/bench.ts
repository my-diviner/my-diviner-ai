import { awaitAllCallbacks, AzureChatOpenAI } from '../test.deps.ts';

Deno.test('Workshop Bench', async (t) => {
  const model = new AzureChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    maxRetries: 5,
  });

  await t.step('Invoke Test', async () => {});

  await t.step('Stream Test', async () => {});

  await awaitAllCallbacks();
});
