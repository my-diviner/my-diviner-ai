import {
  AIMessage,
  awaitAllCallbacks,
  AzureChatOpenAI,
  ChatMessageHistory,
  ChatPromptTemplate,
  HumanMessage,
  MessagesPlaceholder,
  RunnableWithMessageHistory,
  SystemMessage,
} from '../test.deps.ts';

Deno.test('Workshop Bench', async (t) => {
  const model = new AzureChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
    // maxTokens: 1000,
    maxRetries: 5,
    verbose: true,
  });

  await awaitAllCallbacks();
});
