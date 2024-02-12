import { TarotDiviner } from "../../src/diviners/TarotDiviner.ts";
import { awaitAllCallbacks } from "../test.deps.ts";

Deno.test('Tarot Chain Tests', async (t) => {
  const diviner = new TarotDiviner();

  await t.step('TarotDiviner Chat Stream', async () => {
    const res = await diviner.ThreeCardReading(
      {
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
