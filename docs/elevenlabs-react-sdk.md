# ElevenLabs React SDK Documentation

**Conversational AI SDK: deploy customized, interactive voice agents in minutes.**

> Also see the [Conversational AI overview](https://elevenlabs.io/docs/conversational-ai/overview)

## Installation

Install the package in your project through package manager.

\`\`\`shell
npm install @elevenlabs/react
# or
yarn add @elevenlabs/react
# or
pnpm install @elevenlabs/react
\`\`\`

## Usage

### useConversation

React hook for managing websocket connection and audio usage for ElevenLabs Conversational AI.

#### Initialize conversation

First, initialize the Conversation instance.

\`\`\`tsx
const conversation = useConversation();
\`\`\`

Note that Conversational AI requires microphone access.
Consider explaining and allowing access in your apps UI before the Conversation kicks off.

\`\`\`js
// call after explaining to the user why the microphone access is needed
await navigator.mediaDevices.getUserMedia({ audio: true });
\`\`\`

#### Options

The Conversation can be initialized with certain options. Those are all optional.

\`\`\`tsx
const conversation = useConversation({
  /* options object */
});
\`\`\`

- **onConnect** - handler called when the conversation websocket connection is established.
- **onDisconnect** - handler called when the conversation websocket connection is ended.
- **onMessage** - handler called when a new message is received. These can be tentative or final transcriptions of user voice, replies produced by LLM, or debug message when a debug option is enabled.
- **onError** - handler called when a error is encountered.

#### Methods

**startSession**

`startSession` method kick off the websocket connection and starts using microphone to communicate with the ElevenLabs Conversational AI agent.
The method accepts options object, with the `url` or `agentId` option being required.

Agent ID can be acquired through [ElevenLabs UI](https://elevenlabs.io/app/conversational-ai) and is always necessary.

\`\`\`js
const conversation = useConversation();
const conversationId = await conversation.startSession({ url });
\`\`\`

For the public agents, define `agentId` - no signed link generation necessary.

In case the conversation requires authorization, use the REST API to generate signed links. Use the signed link as a `url` parameter.

`startSession` returns promise resolving to `conversationId`. The value is a globally unique conversation ID you can use to identify separate conversations.

\`\`\`js
// your server
const requestHeaders: HeadersInit = new Headers();
requestHeaders.set("xi-api-key", process.env.XI_API_KEY); // use your ElevenLabs API key

const response = await fetch(
  "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id={{agent id created through ElevenLabs UI}}",
  {
    method: "GET",
    headers: requestHeaders,
  }
);

if (!response.ok) {
  return Response.error();
}

const body = await response.json();
const url = body.signed_url; // use this URL for startSession method.
\`\`\`

**endSession**

A method to manually end the conversation. The method will end the conversation and disconnect from websocket.

\`\`\`js
await conversation.endSession();
\`\`\`

**setVolume**

A method to set the output volume of the conversation. Accepts object with volume field between 0 and 1.

\`\`\`js
await conversation.setVolume({ volume: 0.5 });
\`\`\`

**status**

A React state containing the current status of the conversation.

\`\`\`js
const { status } = useConversation();
console.log(status); // "connected" or "disconnected"
\`\`\`

**isSpeaking**

A React state containing the information of whether the agent is currently speaking.
This is helpful for indicating the mode in your UI.

\`\`\`js
const { isSpeaking } = useConversation();
console.log(isSpeaking); // boolean
\`\`\`
