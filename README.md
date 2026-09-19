# GreenMint NFT Marketplace

Implementacao do desafio frontend da Jungle Gaming: um marketplace de NFTs em React e TypeScript com catalogo, detalhe, favoritos, carrinho, checkout, confirmacao de pedido, autenticacao, perfil, carteiras, mocks REST, tempo real e testes E2E.

- [Como rodar](#como-rodar)
- [Comandos](#comandos)
- [Variaveis de ambiente](#variaveis-de-ambiente)
- [Contas e dados de teste](#contas-e-dados-de-teste)
- [Cenarios de mock](#cenarios-de-mock)
- [Stack](#stack)
- [Fluxos principais](#fluxos-principais)
- [Testes](#testes)
- [Lighthouse](#lighthouse)
- [Deploy](#deploy)
- [Documentacao tecnica](#documentacao-tecnica)

## Como rodar

Pre-requisito: Node.js 20 ou superior.

```bash
make setup   # prepara tudo a partir de um checkout limpo
make dev     # http://localhost:5173
```

`make setup` instala as dependencias, baixa o Chromium do Playwright, gera o worker do MSW em `public/` e cria o `.env` a partir do `.env.example`. Em desenvolvimento os mocks sao ativados automaticamente.

## Comandos

```bash
make setup         # prepara o ambiente do zero
make dev           # aplicacao com mocks em http://localhost:5173
make build         # build de demonstracao, com mocks
make preview       # build + preview em http://localhost:4173
make typecheck     # TypeScript sem emitir arquivos
make lint          # ESLint
make test          # Playwright em desktop (1440 px) e mobile (390 px)
make test-update   # regera as baselines visuais
make test-report   # abre o relatorio HTML da ultima execucao
make lighthouse    # 3 medicoes por pagina e perfil, com medianas
make verify        # typecheck + lint + build + testes
make clean         # remove dist, reports e test-results
```

`make help` mostra essa lista no terminal.

Sem Make, os mesmos passos existem como scripts npm:

```bash
npm run dev
VITE_ENABLE_MSW=true npm run build
npm run preview
npm run typecheck
npm run lint
npm run test:e2e
npm run test:e2e:report
npm run lighthouse
```

### Docker (opcional)

```bash
make docker-setup     # constroi a imagem e instala as dependencias
make docker-dev       # Vite no container, em http://localhost:5173
make docker-preview   # preview em http://localhost:4173
make docker-verify    # typecheck + lint + build + testes no container
make docker-down      # derruba os servicos e volumes
```

## Variaveis de ambiente

- `VITE_ENABLE_MSW` — liga os mocks no build de demonstracao. O `make setup` grava `true` no `.env`. Em `npm run dev` os mocks ja sao ativados automaticamente.
- `PLAYWRIGHT_BASE_URL` — URL alvo dos testes E2E. Padrao: `http://127.0.0.1:4173`.

O `.env.example` e a referencia; `make setup` o copia para `.env` se ele ainda nao existir.

## Contas e dados de teste

As contas sao ficticias e vivem apenas nos mocks (`src/mocks/state.ts`). As senhas nao sao gravadas em claro: o mock guarda um hash e o navegador guarda apenas o token da sessao.

**Julia Monteiro** — `julia@greenmint.dev` / `greenmint`

- duas carteiras: principal na Ethereum e secundaria na Polygon
- Emerald Ape #042 nos favoritos
- carrinho com dois itens e o cupom `KURIO10` aplicado

**Caio Araujo** — `caio@greenmint.dev` / `kurioaccess`

- uma carteira principal
- Onyx Visual #232 nos favoritos
- um item no carrinho

A segunda conta existe para o cenario de troca de usuario: ao sair de uma e entrar na outra, favoritos, carrinho, perfil, carteiras e pedidos nao podem vazar entre elas.

Visitantes sem login tambem tem carrinho proprio, preservado e mesclado ao da conta no momento do login.

O cadastro funciona: qualquer e-mail novo cria uma conta, e repetir um e-mail existente retorna conflito.

### Cupons

- `KURIO10` — 10% de desconto
- `JUNGLE10` — 10% de desconto
- `FREEMINT` — 5% de desconto
- `APE5` — erro: cupom ja utilizado
- `EXPIRADO` — erro: cupom expirado
- qualquer outro codigo — erro: cupom invalido

### Onde esses dados ficam

Nao existe banco nem servidor: a API e o MSW rodando no navegador de cada visitante. O estado parte da semente de `src/mocks/state.ts` e fica no `localStorage`, na chave `kurio-msw-state-v1`.

Na pratica, inclusive no ambiente publicado:

- Julia e Caio existem sempre; sao recriados pela semente no primeiro acesso e em cada reset.
- Contas criadas pelo cadastro valem apenas naquele navegador.
- Limpar os dados do site, usar uma janela anonima ou chamar `POST /api/mock/reset` restaura o cenario inicial.
- Cada visitante tem um estado isolado, entao um teste nao interfere no de outra pessoa.

## Cenarios de mock

Aplique por URL com `?cenario=<nome>`, por exemplo `/?cenario=lento` ou `/?cenario=pagamento-recusado`.

- `padrao` — latencia curta e pagamento confirmado
- `lento` — latencia de 1,5 s com variacao
- `instavel` — as proximas requisicoes falham com 503
- `offline` — REST falha e o Socket.IO desconecta
- `fora-de-ordem` — a proxima listagem chega atrasada
- `sessao-expirada` — as sessoes passam a retornar 401
- `carteira-recusada` — a conexao da carteira e recusada
- `pagamento-recusado` — o pedido termina recusado
- `pagamento-pendente` — o pedido permanece pendente
- `timeout-pedido` — o pedido e criado, mas a resposta retorna timeout

Endpoints de controle, usados tambem pelos testes:

- `POST /api/mock/reset` — restaura o cenario inicial
- `GET /api/mock/scenario` — le o cenario atual
- `PATCH /api/mock/scenario` — ajusta latencia, falhas, pagamento e sessao
- `PATCH /api/mock/nfts/:nftId` — muda preco ou disponibilidade e emite `nft.updated`
- `POST /api/mock/realtime/replay-last` — reenvia o ultimo evento (duplicata)
- `POST /api/mock/realtime/replay-stale` — reenvia um evento antigo (versao anterior)
- `POST /api/mock/realtime/disconnect` — derruba as conexoes de tempo real

## Stack

- **React 19 + TypeScript** — toda a interface, com contratos tipados em `src/contracts/api.ts`
- **Vite** — build e servidor de desenvolvimento
- **TanStack Router** — rotas, parametros de busca do catalogo na URL e protecao das rotas privadas (`src/main.tsx`, `src/modules/auth/RequireAuth.tsx`)
- **TanStack Query** — consultas, mutations, cache por usuario, invalidacao e atualizacao otimista dos favoritos
- **Axios** — unico cliente HTTP, com interceptor de sessao (`src/lib/api.ts`)
- **Socket.IO Client** — eventos `nft.updated` e `order.updated` (`src/lib/socket.ts`)
- **Tailwind CSS** — estilos e responsividade
- **MSW** — API REST simulada, cenarios de falha e servidor de eventos (`src/mocks/`)
- **Playwright** — testes E2E e regressao visual em desktop e mobile
- **Lighthouse** — auditoria de performance e qualidade (`scripts/run-lighthouse.mjs`)

## Fluxos principais

- **Catalogo** — busca, filtros combinaveis, ordenacao, paginacao, estado na URL, vazio, erro e resposta fora de ordem
- **Detalhe** — acesso direto, NFT inexistente, quantidade, favoritos e compra
- **Carrinho** — adicionar, alterar, remover, cupom, persistencia e mescla do carrinho de visitante no login
- **Checkout** — dados do colecionador, carteira, rede, conexao simulada, revisao, idempotencia e recuperacao apos falha
- **Pedido** — pendente, confirmado, recusado, recibo com snapshot e transacao simulada
- **Conta** — login, cadastro, logout, sessao expirada, perfil, avatar, senha e carteiras
- **Tempo real** — `nft.updated` e `order.updated` via `socket.io-client`

## Testes

Os testes rodam contra os mocks e resetam o estado a cada caso. A suite cobre Chromium em desktop (1440 px) e mobile (390 px), e as baselines visuais ficam em `tests/e2e/visual.spec.ts-snapshots`.

Por padrao a execucao e headless: o navegador e controlado automaticamente, sem abrir janela.

```bash
make test                      # execucao padrao
npx playwright test --headed   # mostra o navegador executando os passos
npx playwright test --ui       # modo interativo, com time travel
make test-report               # relatorio HTML da ultima execucao
```

## Lighthouse

`make lighthouse` faz o build com os mocks, sobe o preview e roda 3 medicoes de inicio e detalhe, em mobile e desktop. Os relatorios HTML/JSON e o resumo das medianas ficam em `reports/lighthouse`.

## Deploy

O `netlify.toml` ja define build, pasta publicada, cache dos assets e fallback SPA, para que refresh e acesso direto as rotas funcionem.

- Build command: `VITE_ENABLE_MSW=true npm run build`
- Publish directory: `dist`

## Documentacao tecnica

- [ARCHITECTURE.md](./ARCHITECTURE.md) — contratos, cache, sessao, carrinho, tempo real, decisoes e limitacoes
- [CHECKLIST_ENTREGA_DECISOES.md](./CHECKLIST_ENTREGA_DECISOES.md) — checklist de entrega e pendencias
