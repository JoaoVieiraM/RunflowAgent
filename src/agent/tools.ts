import { tool } from "ai";
import { z } from "zod";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:3000";

export const tools = {
  list_products: tool({
    description:
      "Lista todos os produtos disponíveis na loja com id, nome, descrição, preço e quantidade em estoque.",
    parameters: z.preprocess((val) => val ?? {}, z.object({})),
    execute: async () => {
      const res = await fetch(`${API_BASE}/products`);
      return res.json();
    },
  }),

  get_product: tool({
    description: "Busca os detalhes completos de um produto específico pelo seu ID numérico.",
    parameters: z.object({
      id: z.number().int().positive().describe("ID numérico do produto"),
    }),
    execute: async ({ id }) => {
      const res = await fetch(`${API_BASE}/products/${id}`);
      if (!res.ok) {
        const err = await res.json() as { error: string };
        return { error: err.error };
      }
      return res.json();
    },
  }),

  get_order_status: tool({
    description:
      "Consulta o status, itens e total de um pedido existente pelo seu ID numérico.",
    parameters: z.object({
      id: z.number().int().positive().describe("ID numérico do pedido"),
    }),
    execute: async ({ id }) => {
      const res = await fetch(`${API_BASE}/orders/${id}`);
      if (!res.ok) {
        const err = await res.json() as { error: string };
        return { error: err.error };
      }
      return res.json();
    },
  }),

  create_order: tool({
    description:
      "Cria um novo pedido com uma lista de produtos e suas quantidades. Retorna o pedido criado com ID e total.",
    parameters: z.object({
      items: z
        .array(
          z.object({
            productId: z.number().int().positive().describe("ID do produto"),
            quantity: z.number().int().positive().describe("Quantidade desejada"),
          })
        )
        .min(1)
        .describe("Lista de itens do pedido"),
    }),
    execute: async ({ items }) => {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        return { error: err.error };
      }
      return res.json();
    },
  }),
};
