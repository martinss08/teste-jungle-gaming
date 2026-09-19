# GreenMint NFT Marketplace

Implementacao do desafio frontend da Jungle Gaming: um marketplace de NFTs em React e TypeScript com catalogo, detalhe, favoritos, carrinho, checkout, confirmacao de pedido, autenticacao, perfil, carteiras, mocks REST, tempo real e testes E2E.

## Stack

- React + TypeScript + Vite
- TanStack Router
- TanStack Query
- Axios
- Tailwind CSS
- MSW
- Socket.IO Client
- Playwright
- Lighthouse

## Como rodar

```bash
npm install
npm run dev
```

A aplicacao abre em `http://localhost:5173`. Em desenvolvimento, o MSW e ativado automaticamente.

Para testar o build de demonstracao com mocks:

```bash
VITE_ENABLE_MSW=true npm run build
npm run preview
```

## Credenciais ficticias

Usuario principal:

- E-mail: `julia@greenmint.dev`
- Senha: `greenmint`

Segundo usuario:

- E-mail: `caio@greenmint.dev`
- Senha: `kurioaccess`

## Comandos

```bash
npm run dev              # desenvolvimento com mocks
npm run build            # typecheck + build de producao
npm run preview          # preview do build
npm run typecheck        # TypeScript sem emitir arquivos
npm run lint             # ESLint
npm run test:e2e         # Playwright desktop + mobile
npm run test:e2e:report  # abre o relatorio HTML do Playwright
npm run lighthouse       # build + preview + auditorias Lighthouse
```

## Cenarios de mock

Os cenarios podem ser aplicados por URL com `?cenario=<nome>` ou pelos endpoints de controle usados nos testes.

Presets disponiveis:

- `padrao`: latencia curta e pagamento confirmado.
- `lento`: latencia de 1,5 s com variacao.
- `instavel`: proximas requisicoes falham com 503.
- `offline`: REST falha e Socket.IO desconecta.
- `fora-de-ordem`: proxima listagem chega atrasada.
- `sessao-expirada`: sessoes passam a retornar 401.
- `carteira-recusada`: conexao de carteira e recusada.
- `pagamento-recusado`: pedido termina recusado.
- `pagamento-pendente`: pedido permanece pendente.
- `timeout-pedido`: proximo pedido e criado, mas a resposta retorna timeout.

Exemplos:

```txt
/?cenario=lento
/?cenario=offline
/?cenario=pagamento-recusado
```

Endpoints de apoio:

- `POST /api/mock/reset`
- `GET /api/mock/scenario`
- `PATCH /api/mock/scenario`
- `PATCH /api/mock/nfts/:nftId`
- `POST /api/mock/realtime/replay-last`
- `POST /api/mock/realtime/replay-stale`
- `POST /api/mock/realtime/disconnect`

## Fluxos principais

- Catalogo: busca, filtros combinaveis, ordenacao, paginacao, estado na URL, vazio, erro e resposta fora de ordem.
- Detalhe: acesso direto, NFT inexistente, quantidade, favoritos e compra.
- Carrinho: adicionar, alterar, remover, cupom, persistencia e mescla do carrinho visitante no login.
- Checkout: dados do colecionador, carteira, rede, conexao simulada, revisao, idempotencia e recuperacao apos falha.
- Pedido: pendente, confirmado, recusado, recibo snapshot e transacao simulada.
- Conta: login, cadastro, logout, sessao expirada, perfil, avatar, senha e carteiras.
- Tempo real: `nft.updated` e `order.updated` via `socket.io-client`.

## Testes

Os testes Playwright rodam contra os mocks e resetam o estado por teste. Por padrao, eles executam em modo headless: o Chromium e aberto e controlado automaticamente, mas a janela nao aparece na tela.

```bash
npm run test:e2e
```

Para ver o navegador abrindo e executando os passos:

```bash
npx playwright test --headed
```

Para acompanhar, filtrar e depurar os testes pela interface do Playwright:

```bash
npx playwright test --ui
```

Para abrir o relatorio HTML da ultima execucao:

```bash
npm run test:e2e:report
```

A suite cobre desktop Chromium em 1440 px e mobile Chromium em 390 px. Os snapshots visuais ficam em `tests/e2e/visual.spec.ts-snapshots`.

## Lighthouse

O comando abaixo executa build com MSW habilitado, sobe preview local e roda 3 medicoes para inicio/detalhe em mobile/desktop:

```bash
npm run lighthouse
```

Os relatorios HTML/JSON e o resumo de medianas sao gerados em `reports/lighthouse`.

## Documentacao tecnica

- [ARCHITECTURE.md](./ARCHITECTURE.md): 
    contratos, cache, sessao, carrinho, tempo real, decisoes e limitacoes.
- [CHECKLIST_ENTREGA_DECISOES.md](./CHECKLIST_ENTREGA_DECISOES.md):
    checklist de entrega e pendencias.
- [GUIA_EXPLICACAO_TECNICA.md](./GUIA_EXPLICACAO_TECNICA.md):
    guia para entrevista tecnica.
