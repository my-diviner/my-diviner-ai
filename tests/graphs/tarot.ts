// deno-lint-ignore-file no-explicit-any
import {
  AgentAction,
  awaitAllCallbacks,
  AzureChatOpenAI,
  BaseMessage,
  convertToOpenAIFunction,
  END,
  FunctionMessage,
  HumanMessage,
  RunnableLambda,
  StateGraph,
  TavilySearchResults,
  ToolExecutor,
} from '../test.deps.ts';

Deno.test('Tarot Graph Tests', async (t) => {
  const model = new AzureChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    maxRetries: 5,
  });

  const tools = [new TavilySearchResults({ maxResults: 1 })];

  const toolExecutor = new ToolExecutor({
    tools,
  });

  const toolsAsOpenAIFunctions = tools.map((tool) =>
    convertToOpenAIFunction(tool)
  );

  const toolModel = model.bind({
    functions: toolsAsOpenAIFunctions,
  });

  const shouldContinue = (state: { messages: Array<BaseMessage> }) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    // If there is no function call, then we finish
    if (
      !('function_call' in lastMessage.additional_kwargs) ||
      !lastMessage.additional_kwargs.function_call
    ) {
      return 'end';
    }
    // Otherwise if there is, we continue
    return 'continue';
  };

  const getAction = (state: { messages: Array<BaseMessage> }): AgentAction => {
    const { messages } = state;
    // Based on the continue condition
    // we know the last message involves a function call
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error('No messages found.');
    }
    if (!lastMessage.additional_kwargs.function_call) {
      throw new Error('No function call found in message.');
    }
    // We construct an AgentAction from the function_call
    return {
      tool: lastMessage.additional_kwargs.function_call.name,
      toolInput: JSON.stringify(
        lastMessage.additional_kwargs.function_call.arguments
      ),
      log: '',
    };
  };

  const callModel = async (state: { messages: Array<BaseMessage> }) => {
    const { messages } = state;
    const response = await toolModel.invoke(messages);
    // We return a list, because this will get added to the existing list
    return {
      messages: [response],
    };
  };

  const callTool = async (state: { messages: Array<BaseMessage> }) => {
    const action = getAction(state);
    // We call the tool_executor and get back a response
    const response = await toolExecutor.invoke(action);
    // We use the response to create a FunctionMessage
    const functionMessage = new FunctionMessage({
      content: response,
      name: action.tool,
    });
    // We return a list, because this will get added to the existing list
    return { messages: [functionMessage] };
  };

  const compileWorkflow = (agentState: any) => {
    // Define a new graph
    const workflow = new StateGraph({
      channels: agentState,
    });

    // Define the two nodes we will cycle between
    workflow.addNode('agent', new RunnableLambda({ func: callModel }));
    workflow.addNode('action', new RunnableLambda({ func: callTool }));

    // Set the entrypoint as `agent`
    // This means that this node is the first one called
    workflow.setEntryPoint('agent');

    // We now add a conditional edge
    workflow.addConditionalEdges(
      // First, we define the start node. We use `agent`.
      // This means these are the edges taken after the `agent` node is called.
      'agent',
      // Next, we pass in the function that will determine which node is called next.
      shouldContinue,
      // Finally we pass in a mapping.
      // The keys are strings, and the values are other nodes.
      // END is a special node marking that the graph should finish.
      // What will happen is we will call `should_continue`, and then the output of that
      // will be matched against the keys in this mapping.
      // Based on which one it matches, that node will then be called.
      {
        // If `tools`, then we call the tool node.
        continue: 'action',
        // Otherwise we finish.
        end: END,
      }
    );

    // We now add a normal edge from `tools` to `agent`.
    // This means that after `tools` is called, `agent` node is called next.
    workflow.addEdge('action', 'agent');

    // Finally, we compile it!
    // This compiles it into a LangChain Runnable,
    // meaning you can use it as you would any other runnable
    return workflow.compile();
  };

  await t.step('Tavily Invoke Test', async () => {
    const app = compileWorkflow({
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
    });

    const inputs = {
      messages: [new HumanMessage("what is the weather in Erie, CO")],
    };

    const res = await app.invoke(inputs);

    console.log({ res });
  });

  await t.step('Tavily Stream Test', async () => {
    model.streaming = true;

    const app = compileWorkflow({
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
    });

    const inputs = {
      messages: [new HumanMessage("what is the weather in sf")],
    };

    const res = await app.stream(inputs);

    for await (const token of res) {
      console.log(token);
    }
  });

  await awaitAllCallbacks();
});
