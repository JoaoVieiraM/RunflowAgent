# RunShop Agent — Desafio Técnico Runflow AI

Agente conversacional para uma loja online fictícia. Permite listar produtos, consultar detalhes, criar pedidos e verificar status de compras via chat no terminal.

---

## Como rodar

### Pré-requisitos

- Node.js 18+
- Conta no [Google AI Studio](https://aistudio.google.com) para obter uma API key gratuita

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e adicione sua chave:

```
GOOGLE_GENERATIVE_AI_API_KEY=sua_chave_aqui
API_BASE_URL=http://localhost:3000
```

### 3. Iniciar a API mock

Em um terminal:

```bash
npm run api
```

A API estará disponível em `http://localhost:3000`.

### 4. Iniciar o chat

Em outro terminal:

```bash
npm run chat
```

Digite suas mensagens. Para encerrar, digite `sair` ou pressione `Ctrl+C`.

---

## Estrutura do projeto

```
src/
├── api/
│   ├── data.ts              # Dados em memória (produtos e pedidos)
│   ├── server.ts            # Servidor Express (porta 3000)
│   └── routes/
│       ├── products.ts      # GET /products, GET /products/:id
│       └── orders.ts        # GET /orders/:id, POST /orders
├── agent/
│   ├── prompt.ts            # System prompt do agente
│   ├── tools.ts             # 4 ferramentas com Zod + fetch
│   └── agent.ts             # Loop do agente (generateText + maxSteps)
└── chat.ts                  # Interface CLI readline
```

---

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Linguagem | TypeScript | Requerido/preferencial no desafio |
| Runtime | `tsx` | Executa TypeScript diretamente sem etapa de build |
| Mock API | Express | Simples, amplamente conhecido, zero configuração |
| LLM | Gemini 2.5 Flash | Gratuito via Google AI Studio, excelente suporte a tool calling |
| Agent SDK | Vercel AI SDK (`ai`) | API idiomática para tool calling via Zod; `maxSteps` gerencia o loop automaticamente |
| Interface | CLI readline | Simples de demonstrar múltiplos turnos; fácil de testar e mostrar o contexto |

### Por que Vercel AI SDK?

O SDK abstrai o loop de tool calling: basta definir `maxSteps` e ele gerencia automaticamente o ciclo LLM → tool call → resultado → LLM → resposta final. As ferramentas são tipadas via Zod, eliminando erros de schema em runtime. O suporte a múltiplos provedores facilita trocar o LLM sem alterar a lógica do agente.

### Por que não usar LangChain ou outro framework mais complexo?

LangChain e LlamaIndex adicionam muita abstração para um agente com 4 ferramentas e um loop simples. O Vercel AI SDK entrega exatamente o necessário com código mínimo — pragmatismo sobre arquitetura.

---

## Endpoints da API mock

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/products` | Lista todos os produtos |
| `GET` | `/products/:id` | Detalhes de um produto específico |
| `GET` | `/orders/:id` | Status e itens de um pedido |
| `POST` | `/orders` | Cria um pedido (`[{ productId, quantity }]`) |

---

## Exemplos de conversa

### Fluxo 1 — Listar produtos

```
Você: Quais produtos vocês têm disponíveis?
[ferramentas: list_products]
Assistente: Temos 8 produtos disponíveis:
1. Camiseta Básica — R$ 49,90 (50 em estoque)
2. Calça Jeans Slim — R$ 159,90 (30 em estoque)
...

Você: Me mostra só os que estão em estoque
Assistente: 7 dos 8 produtos têm estoque disponível. O único esgotado é
o Óculos de Sol (id 6).
```

### Fluxo 2 — Detalhes de produto

```
Você: Me conta mais sobre o produto 3
[ferramentas: get_product]
Assistente: O Tênis Running custa R$ 299,90. É leve e respirável, ideal
para corridas e academia. Temos 15 unidades em estoque.

Você: E quanto custa o produto 2?
[ferramentas: get_product]
Assistente: A Calça Jeans Slim custa R$ 159,90, com 30 unidades disponíveis.
```

### Fluxo 3 — Criar pedido

```
Você: Quero comprar 2 unidades do produto 1 e 1 unidade do produto 4
[ferramentas: create_order]
Assistente: Pedido criado com sucesso!
• Pedido #1045
• 2x Camiseta Básica — R$ 49,90 cada
• 1x Boné Snapback — R$ 79,90
• Total: R$ 179,70
• Status: processando
```

### Fluxo 4 — Consultar pedido

```
Você: Qual o status do pedido 1042?
[ferramentas: get_order_status]
Assistente: O pedido #1042 foi entregue. Ele continha:
• 2x Camiseta Básica
• 1x Boné Snapback
• Total: R$ 179,70

Você: E o que eu pedi nele mesmo?
Assistente: No pedido #1042 você pediu 2 Camisetas Básicas e 1 Boné Snapback.
```

### Fluxo 5 — Tratamento de erros

```
Você: Me fala do produto 999
[ferramentas: get_product]
Assistente: Não encontrei nenhum produto com o id 999. Quer que eu liste
os produtos disponíveis?

Você: Quero comprar 1000 unidades do produto 1
[ferramentas: create_order]
Assistente: Não foi possível criar o pedido. Temos apenas 50 unidades da
Camiseta Básica em estoque.

Você: Qual o status do pedido 9999?
[ferramentas: get_order_status]
Assistente: Não encontrei nenhum pedido com o id 9999. Verifique o número
e tente novamente.
```

### Fluxo 6 — Limites do agente

```
Você: Qual a previsão do tempo em SP?
Assistente: Isso está fora do meu escopo — sou especializado na RunShop.
Posso ajudar com produtos, pedidos ou criação de compras!

Você: Cancela meu pedido 1042
Assistente: Infelizmente não consigo cancelar pedidos. Essa operação não
está disponível. Para suporte, entre em contato com nossa equipe.
```

---

## Dificuldades e erros encontrados

### 1. Modelo `gemini-2.5-flash-preview-05-20` indisponível na API v1beta

O `@ai-sdk/google` usa o endpoint `v1beta` da API do Google por padrão. O model ID `gemini-2.5-flash-preview-05-20` não estava disponível nessa versão do endpoint, retornando o erro:

```
models/gemini-2.5-flash-preview-05-20 is not found for API version v1beta
```

**Solução tentada:** trocar para `gemini-2.0-flash`, que é um modelo estável e disponível no endpoint `v1beta`.

### 2. Quota zerada no free tier do Google AI Studio (`gemini-2.0-flash`)

Após a troca de modelo, o agente retornou erro de quota:

```
Quota exceeded for metric: generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash
```

O `limit: 0` indica que o projeto do Google Cloud associado à chave não possui cota alocada para o free tier nesse modelo — possivelmente por restrição de região ou configuração do projeto. O erro não é de código, e sim de configuração de conta.

**Próximo passo:** migrar o provedor para **Groq** (gratuito, sem billing, sem cartão), mantendo toda a lógica do agente intacta.

---

## Melhorias futuras

- **Persistência**: substituir dados em memória por banco de dados (SQLite ou PostgreSQL)
- **Autenticação**: identificação de sessão/usuário para histórico persistente entre conversas
- **Interface web**: chat em browser com Next.js e streaming de respostas via `streamText`
- **Mais ferramentas**: busca por nome, filtro por categoria, histórico de pedidos do usuário
- **Testes**: testes unitários das rotas da API e testes de integração do loop do agente
