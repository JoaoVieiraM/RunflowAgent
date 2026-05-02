import { generateText, CoreMessage } from "ai";
import { google } from "@ai-sdk/google";
import { tools } from "./tools.js";
import { systemPrompt } from "./prompt.js";

export interface AgentResult {
  response: string;
  updatedHistory: CoreMessage[];
  toolsUsed: string[];
}

export async function runAgent(
  userMessage: string,
  history: CoreMessage[]
): Promise<AgentResult> {
  const messages: CoreMessage[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  const toolsUsed: string[] = [];

  const result = await generateText({
    model: google("gemini-2.0-flash"),
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 5,
    onStepFinish({ toolCalls }) {
      for (const call of toolCalls) {
        toolsUsed.push(call.toolName);
      }
    },
  });

  const updatedHistory: CoreMessage[] = [
    ...messages,
    { role: "assistant", content: result.text },
  ];

  return { response: result.text, updatedHistory, toolsUsed };
}
