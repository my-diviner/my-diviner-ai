import {
  awaitAllCallbacks,
  AzureChatOpenAI,
} from '../test.deps.ts';

Deno.test('Tarot Chain Tests', async (t) => {
  const model = new AzureChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    maxRetries: 5,
  });

  await t.step('Basic Tarot Reading Test', async () => {
    const res = await model.invoke(
      'Question: What is my daily tarot reading with the 7 of pentacles, 2 of cups, and the King of cups?\nAnswer:'
    );

    console.log({ res });
  });

  await t.step('Basic Tarot Reading Stream', async () => {
    model.streaming = true;

    const res = await model.stream(
      'Question: What is my daily tarot reading with the 7 of pentacles, 2 of cups, and the King of cups?\nAnswer:'
    );

    for await (const { content } of res) {
      console.log(content);
    }
  });

  await awaitAllCallbacks();
});
