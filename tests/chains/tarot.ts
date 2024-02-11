import {
  awaitAllCallbacks,
  AzureChatOpenAI,
  ChatPromptTemplate,
  AIMessage,
  HumanMessage,
  SystemMessage,
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
      'Question: What is my daily tarot 3 card (past, present and future) reading with the 7 of pentacles, 2 of cups, and the King of cups?\nAnswer:'
    );

    for await (const { content } of res) {
      console.log(content);
    }
  });

  await t.step('Basic Tarot Chat Stream', async () => {
    model.streaming = true;

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You are an expert tarot diviner, with decades of experience doing all different kinds of tarot readings for people. In this case, you are doing a {readingType}.',
      ],
      // new MessagesPlaceholder("history"),
      [
        'ai',
        'Hello, I am your tarot diviner. Today we will be doing a {readingType}.',
      ],
      [
        'human',
        'What is my {readingType} with the {past}, {present} and {future} cards?',
      ],
    ]);

    const chain = prompt.pipe(model);

    const res = await chain.stream(
      {
        readingType: '3 card (past, present, future) reading',
        past: '7 of pentacles',
        present: '2 of cups',
        future: 'King of cups',
      }
    );

    for await (const { content } of res) {
      console.log(content);
    }
  });

  await awaitAllCallbacks();
});
