import { generateText, CoreMessage } from "ai";
import { createGroq } from "@ai-sdk/groq";
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

  let resultText: string;

  try {
    const result = await generateText({
      model: createGroq()("llama-3.3-70b-versatile"),
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
    // Remove leaked Llama tool-call tags from the response text
    resultText = result.text.replace(/<function=\w+><\/function>/g, "").trim();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("failed_generation") || msg.includes("Failed to call a function")) {
      resultText = "Desculpe, não consegui processar essa solicitação. Pode tentar reformular? Se quiser buscar um produto pelo nome, posso listar todos os disponíveis primeiro.";
    } else {
      throw error;
    }
  }

  const updatedHistory: CoreMessage[] = [
    ...messages,
    { role: "assistant", content: resultText },
  ];

  return { response: resultText, updatedHistory, toolsUsed };
}
