import "dotenv/config";
import readline from "readline";
import { CoreMessage } from "ai";
import { runAgent } from "./agent/agent.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let history: CoreMessage[] = [];

const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";

console.log(`\n${CYAN}RunShop Assistente${RESET}`);
console.log(`${DIM}Digite sua mensagem ou "sair" para encerrar.${RESET}\n`);

function ask(): void {
  rl.question(`${YELLOW}Você:${RESET} `, async (input) => {
    const message = input.trim();

    if (!message) {
      ask();
      return;
    }

    if (message.toLowerCase() === "sair") {
      console.log(`\n${CYAN}Assistente:${RESET} Até logo!\n`);
      rl.close();
      return;
    }

    try {
      const { response, updatedHistory, toolsUsed } = await runAgent(message, history);
      history = updatedHistory;

      if (toolsUsed.length > 0) {
        console.log(`${DIM}[ferramentas: ${toolsUsed.join(", ")}]${RESET}`);
      }

      console.log(`\n${CYAN}Assistente:${RESET} ${response}\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nErro: ${message}\n`);
    }

    ask();
  });
}

ask();
