# RunShop Agent — Desafio Técnico Runflow AI

Esse projeto é o meu desafio técnico para a vaga de AI Solution Engineer Jr. na Runflow AI. O objetivo foi construir um agente conversacional do zero, capaz de consultar produtos, criar pedidos e verificar status de compras em uma loja fictícia chamada RunShop.

Repositório: https://github.com/JoaoVieiraM/RunflowAgent

A interface é um chat no terminal. O agente usa um LLM real com tool calling para buscar dados de uma API mock local e responder ao usuário de forma natural, mantendo o contexto da conversa.

## Como rodar o projeto

### Pré-requisitos

- Node.js 18 ou superior
- Uma conta gratuita no Groq para obter a API key (sem cartão de crédito)

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd runflow-agent
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave do Groq:

```env
GROQ_API_KEY=sua_chave_aqui
API_BASE_URL=http://localhost:3000
```

Para gerar a chave: acesse [console.groq.com](https://console.groq.com), crie uma conta com seu e-mail e vá em **API Keys > Create API Key**. Não é necessário cartão de crédito.

### 4. Iniciar a API mock

Abra um terminal e rode:

```bash
npm run api
```

A mensagem `API mock rodando em http://localhost:3000` vai confirmar que está no ar.

### 5. Iniciar o chat

Em outro terminal, rode:

```bash
npm run chat
```

Digite sua mensagem e pressione Enter. Para encerrar a conversa, digite `sair` ou pressione `Ctrl+C`.

## Estrutura do projeto

```
src/
├── api/
│   ├── data.ts              # Dados em memória: 8 produtos e 3 pedidos de exemplo
│   ├── server.ts            # Servidor Express na porta 3000
│   └── routes/
│       ├── products.ts      # GET /products e GET /products/:id
│       └── orders.ts        # GET /orders/:id e POST /orders
├── agent/
│   ├── prompt.ts            # System prompt com persona e limites do agente
│   ├── tools.ts             # 4 ferramentas tipadas com Zod
│   └── agent.ts             # Loop do agente via generateText com maxSteps
└── chat.ts                  # Interface CLI com readline
```

## Decisões técnicas

### TypeScript com tsx

Escolhi TypeScript por ser a opção preferencial do desafio e porque o tsx permite rodar arquivos `.ts` diretamente sem precisar compilar. Para um projeto de escopo fechado como esse, eliminar a etapa de build foi uma decisão pragmática que acelerou o desenvolvimento.

### API mock com Express

Usei Express por ser simples e previsível. A API não tem nenhuma abstração desnecessária: rotas diretas, dados em memória, status HTTP corretos para cada caso de erro. Qualquer coisa mais sofisticada aqui seria overengineering para uma API de mock.

### LLM: Groq com Llama 3.3 70B

A escolha inicial foi o Gemini 2.5 Flash do Google AI Studio, que é sugerido no desafio como opção gratuita. Mas durante os testes encontrei dois problemas seguidos (detalho na seção de dificuldades). A solução foi migrar para o Groq, que é completamente gratuito, não exige configuração de projeto no Google Cloud, e o modelo `llama-3.3-70b-versatile` tem ótimo suporte a tool calling com baixa latência.

### Vercel AI SDK como framework do agente

Em vez de implementar o loop de tool calling manualmente, usei o Vercel AI SDK. O motivo principal foi a opção `maxSteps` no `generateText`: ela gerencia automaticamente o ciclo de LLM chamando ferramenta, recebendo o resultado e gerando a resposta final. As ferramentas são definidas com schemas Zod, o que garante tipagem e validação em runtime. Quando precisei trocar de Google para Groq, não alterei nada na lógica do agente, só o import do provider e a variável de ambiente.

A alternativa seria implementar o loop manualmente detectando `tool_use` na resposta e iterando. É viável, mas mais verboso sem nenhum ganho real para esse escopo.

### Interface CLI com readline

A forma mais direta de demonstrar múltiplos turnos de conversa com contexto mantido. Uma interface web seria mais bonita, mas adicionaria complexidade sem benefício para os testes de aceite do desafio.

### O que deixei de fora de propósito

Não usei Docker, banco de dados, autenticação ou qualquer estrutura de microserviços. Tudo isso está fora do escopo pedido e adicionaria configuração sem valor demonstrável. Os dados em memória são suficientes para o agente funcionar corretamente em todos os fluxos testados.

Também não implementei streaming de respostas. O `generateText` é síncrono e mais simples de usar junto com o histórico de mensagens. O `streamText` seria melhor para a UX, mas adicionaria complexidade no gerenciamento do estado da conversa.

## Dificuldades encontradas

### Modelo Gemini indisponível no endpoint v1beta

O `@ai-sdk/google` faz chamadas para o endpoint `v1beta` da API do Google por padrão. O model ID `gemini-2.5-flash-preview-05-20` não estava disponível nessa versão, retornando:

```
models/gemini-2.5-flash-preview-05-20 is not found for API version v1beta
```

Troquei para `gemini-2.0-flash`, que é um modelo estável e listado como compatível com esse endpoint.

### Quota zerada no free tier do Google AI Studio

Após trocar o modelo, o agente retornou erro de quota:

```
Quota exceeded for metric: generate_content_free_tier_requests, limit: 0
```

O `limit: 0` indica que o projeto do Google Cloud associado à chave não tem cota alocada no free tier. Não é um erro de código, é uma configuração do projeto ou restrição de região. Como resolver isso dependeria de acesso ao console do Google Cloud, o que tornaria o setup do projeto mais complexo do que o necessário.

A decisão foi migrar para o Groq, que resolve os dois problemas de uma vez.

### Parâmetros nulos no tool calling com Llama

Após migrar para o Groq, a ferramenta `list_products` (que não recebe parâmetros) estava quebrando com o erro:

```
Invalid arguments for tool list_products: Type validation failed: Value: null
```

O modelo Llama chamava a ferramenta passando `null` como argumento em vez de `{}`. O schema `z.object({})` do Zod rejeita `null`. A correção foi usar `z.preprocess` para converter `null` para um objeto vazio antes da validação:

```typescript
parameters: z.preprocess((val) => val ?? {}, z.object({}))
```

### Tags de tool calling vazando na resposta

Em alguns casos, principalmente após perguntas fora do escopo, o Llama incluía a sintaxe interna de chamada de ferramenta diretamente no texto de resposta:

```
Desculpe, não posso ajudar com isso. <function=list_products></function>
```

Isso acontece porque o histórico de conversa acumula padrões mistos (recusas + tool calls) que confundem o modelo. A correção foi dupla: adicionar uma instrução explícita no system prompt para nunca incluir essas tags no texto, e aplicar um regex no `agent.ts` para remover qualquer tag que ainda vaze:

```typescript
resultText = result.text.replace(/<function=\w+><\/function>/g, "").trim();
```

### Erro `failed_generation` ao buscar produto por nome

Quando o usuário pedia um produto pelo nome em vez do ID (por exemplo, "me fale dos óculos de sol"), o modelo tentava chamar `get_product` mas não conseguia gerar parâmetros válidos, já que a ferramenta espera um ID numérico. O Groq retornava:

```
Failed to call a function. Please adjust your prompt. See 'failed_generation' for more details.
```

A correção foi tratar esse erro no `agent.ts` com uma mensagem amigável, e instruir o modelo no system prompt a chamar `list_products` primeiro para descobrir o ID correto quando o usuário mencionar um produto pelo nome.

## O que faria diferente com mais tempo

**Streaming de respostas.** Trocar `generateText` por `streamText` para exibir os tokens em tempo real no terminal. A percepção de velocidade melhora muito, especialmente em respostas longas.

**Interface web.** Um chat em Next.js com Server-Sent Events tornaria o projeto bem mais apresentável e próximo de um produto real.

**Persistência de sessão.** Salvar o histórico de conversa em banco (SQLite seria suficiente) para retomar sessões entre execuções.

**Confirmação antes de criar pedido.** O agente poderia confirmar os itens com o usuário antes de chamar `create_order`, evitando pedidos acidentais em casos de ambiguidade.

**Testes automatizados.** Testes unitários para as rotas da API e testes de integração para os fluxos de tool calling com um LLM mockado.

## Exemplos de conversas testadas

### Fluxo 1 — Listar produtos

```
Você: Quais produtos vocês têm disponíveis?
[ferramentas: list_products]
Assistente: Aqui estão os produtos disponíveis na RunShop:

1. Camiseta Básica (id 1) - R$ 49,90 | Estoque: 50
2. Calça Jeans Slim (id 2) - R$ 159,90 | Estoque: 30
3. Tênis Running (id 3) - R$ 299,90 | Estoque: 15
4. Boné Snapback (id 4) - R$ 79,90 | Estoque: 100
5. Mochila Urbana (id 5) - R$ 189,90 | Estoque: 20
6. Óculos de Sol (id 6) - R$ 129,90 | Sem estoque
7. Meias Kit 3 Pares (id 7) - R$ 29,90 | Estoque: 200
8. Cinto de Couro (id 8) - R$ 89,90 | Estoque: 10

Você: Me mostra só os que estão em estoque
Assistente: Dos 8 produtos, 7 estão com estoque disponível. O único
esgotado no momento é o Óculos de Sol (id 6). Todos os outros podem
ser pedidos normalmente.
```

### Fluxo 2 — Detalhes de produto

```
Você: Me conta mais sobre o produto 3
[ferramentas: get_product]
Assistente: O Tênis Running (id 3) custa R$ 299,90. É um tênis leve e
respirável, ideal para corridas e academia. Temos 15 unidades em estoque.

Você: E quanto custa o produto 2?
[ferramentas: get_product]
Assistente: A Calça Jeans Slim (id 2) custa R$ 159,90. É uma calça com
corte slim, confortável para o dia a dia. Temos 30 unidades em estoque.
```

### Fluxo 3 — Criar pedido

```
Você: Quero comprar 2 unidades do produto 1 e 1 unidade do produto 4
[ferramentas: create_order]
Assistente: Pedido criado com sucesso! Aqui está o resumo:

Pedido #1045
2x Camiseta Básica - R$ 49,90 cada
1x Boné Snapback - R$ 79,90
Total: R$ 179,70
Status: processando
```

### Fluxo 4 — Consultar pedido

```
Você: Qual o status do pedido 1042?
[ferramentas: get_order_status]
Assistente: O pedido #1042 já foi entregue. Ele continha:

2x Camiseta Básica - R$ 49,90 cada
1x Boné Snapback - R$ 79,90
Total: R$ 179,70
Criado em: 10/04/2025

Você: E o que eu pedi nele mesmo?
Assistente: No pedido #1042 você pediu 2 unidades de Camiseta Básica
e 1 unidade de Boné Snapback.
```

### Fluxo 5 — Tratamento de erros

```
Você: Me fala do produto 999
[ferramentas: get_product]
Assistente: Não encontrei nenhum produto com o id 999 no nosso catálogo.
Quer que eu liste todos os produtos disponíveis?

Você: Quero comprar 1000 unidades do produto 1
[ferramentas: create_order]
Assistente: Não foi possível criar o pedido. A Camiseta Básica tem apenas
50 unidades em estoque, e você solicitou 1000.

Você: Qual o status do pedido 9999?
[ferramentas: get_order_status]
Assistente: Não encontrei nenhum pedido com o id 9999. Verifique se o
número está correto e tente novamente.
```

### Fluxo 6 — Limites do agente

```
Você: Qual a previsão do tempo em SP?
Assistente: Isso está fora do meu escopo. Sou o assistente da RunShop
e só consigo ajudar com produtos, pedidos e status de compras.

Você: Cancela meu pedido 1042
Assistente: Infelizmente o cancelamento de pedidos não está disponível
por aqui. Para resolver isso, entre em contato com o suporte da loja.
```

## Variáveis de ambiente

O arquivo `.env.example` na raiz do projeto contém as variáveis necessárias:

```env
# Chave de API do Groq (gratuito em console.groq.com)
GROQ_API_KEY=your_groq_api_key_here

# URL base da API mock (padrão: http://localhost:3000)
API_BASE_URL=http://localhost:3000
```
