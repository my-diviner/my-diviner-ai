import {
  AzureChatOpenAI,
  BaseMessageChunk,
  ChatPromptTemplate,
  IterableReadableStream,
} from '../src.dep.ts';

export type ThreeCardReadingRequest = {
    future: string;
    
    past: string;

    present: string;
}

export class TarotDiviner {
  protected chatModel: AzureChatOpenAI;

  protected corePrompt: ChatPromptTemplate;

  constructor() {
    this.chatModel = new AzureChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      //   maxTokens: 1000,
      maxRetries: 5,
      streaming: true,
    });

    this.corePrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You are an expert tarot diviner, with decades of experience doing all different kinds of tarot readings for people. In this case, you are doing a {readingType}. Please respond in markdown with the following example format:\n# [Reading Title]\n\n[Reading recap:2-3 sentences]\n\n## Past:\t\t[card]\n\n[Card information:5-10 sentences]\n\n## Present:\t\t[card]\n\n[Card information:5-10 sentences]\n\n## Future:\t\t[card]\n\n[Card information:5-10 sentences]\n\n---\n\n## Summary\n\n[summary:5-8 sentences]\n\n[disclaimer that tarot does not predict the future, and that control is in decisions that are made]',
      ],
      // new MessagesPlaceholder("history"),
      [
        'ai',
        'Hello, I am your tarot diviner. Today we will be doing a {readingType}.',
      ],
      // [
      //   'human',
      //   'My life has been in a bit of turmoil, my wife and I had a separation and she is just now moved back in.',
      // ],
      // [
      //   'ai',
      //   'I will keep your current life situation in mind, and provide a summary that speaks to it, what are your cards?',
      // ],
      [
        'human',
        'What is my {readingType} with the {past}, {present} and {future} cards?',
      ],
    ]);
  }

  public async ThreeCardReading(reading: ThreeCardReadingRequest): Promise<IterableReadableStream<BaseMessageChunk>> {
    const chain = this.corePrompt.pipe(this.chatModel);

    const res = await chain.stream({
      readingType: '3 card (past, present, future) reading',
      ...reading,
    });

    return res;
  }
}
