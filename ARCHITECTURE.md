# Arquitetura e decisoes

Este documento registra as decisoes tecnicas da solucao, os contratos usados pela aplicacao e as principais limitacoes dos mocks.

## Visao geral

A aplicacao foi implementada como um frontend real consumindo uma API REST simulada por MSW. Componentes e hooks nao recebem dados ficticios diretamente: eles chamam clientes REST via Axios, usam TanStack Query para estado remoto e reagem a eventos de tempo real via `socket.io-client`.

## Rotas

TanStack Router controla as telas e os search params do catalogo.

Rotas principais:

- `/`: inicio e catalogo.
- `/nft/$nftId`: detalhe do NFT.
- `/carrinho`: carrinho.
- `/pagamento`: checkout protegido.
- `/confirmacao?pedido=`: confirmacao protegida.
- `/login`: login.
- `/cadastro`: cadastro.
- `/perfil`: perfil protegido.
- `/carteiras`: carteiras protegidas.

Busca, filtros, ordenacao e pagina do catalogo ficam na URL para sobreviver a refresh, historico e compartilhamento de link.

## Contratos REST

Os tipos ficam em `src/contracts/api.ts` e sao usados por cliente, mocks e UI.

Recursos principais:

- Sessao: 
  `GET /api/session`,
  `POST /api/auth/register`,
  `POST /api/auth/login`,
  `POST /api/auth/logout`,
  `POST /api/auth/expire`.

- NFTs: 
  `GET /api/nfts`,
  `GET /api/nfts/facets`,
  `GET /api/nfts/:nftId`,
  `GET /api/nfts/:nftId/reviews`.

- Favoritos: 
  `GET /api/favorites`,
  `POST /api/favorites/:nftId`,
  `DELETE /api/favorites/:nftId`.

- Carrinho: 
  `GET /api/cart`,
  `POST /api/cart/items`,
  `PATCH /api/cart/items/:nftId`,
  `DELETE /api/cart/items/:nftId`.

- Cupom e cotacao: `
POST /api/cart/coupon`,
  `DELETE /api/cart/coupon`,
  `POST /api/cart/review`,
  `GET /api/quote`.

- Pedidos: 
  `POST /api/orders`,
  `GET /api/orders/:orderId`.

- Colecao: 
  `GET /api/collection`.

- Carteira simulada: 
`POST /api/wallets/connect`.

- Perfil: 
  `GET /api/profile`,
  `PATCH /api/profile`,
  `POST /api/profile/avatar`,
  `POST /api/profile/password`.

- Carteiras: 
  `GET /api/wallets`,
  `POST /api/wallets`,
  `PATCH /api/wallets/:walletId`.

Erros seguem o formato:

```ts
{
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}
```

Codigos relevantes incluem `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `EXPIRED_SESSION`, `NETWORK_UNAVAILABLE`, `TRANSIENT_FAILURE`, `IDEMPOTENCY_CONFLICT`, `QUOTE_CHANGED` e `WALLET_REJECTED`.

## Sessao

O token ficticio fica em `localStorage` apenas para recuperar a sessao apos refresh. O Axios injeta `Authorization: Bearer <token>` e `X-Guest-Id` em cada request.

Rotas privadas usam `RequireAuth`. Quando a sessao expira, a aplicacao limpa a sessao local, preserva o contexto de retorno e mostra feedback para o usuario entrar novamente.

Logout e troca de usuario invalidam caches privados e desconectam o socket da sessao anterior para evitar vazamento de dados.

## Carrinho e cotacao

O carrinho e um recurso remoto simulado. Visitantes usam `X-Guest-Id`; ao autenticar, o mock mescla o carrinho visitante ao carrinho do usuario.

Valores em ETH trafegam como strings decimais. Calculos criticos usam BigInt em wei para evitar erro de ponto flutuante.

A cotacao da API e a fonte oficial para subtotal, desconto, taxa de rede e total. Se preco ou disponibilidade mudam, a cotacao fica `stale` e o checkout e bloqueado ate o usuario aceitar os valores atuais.

## Checkout e pedidos

O fluxo de checkout passa por dados do colecionador, carteira cadastrada, rede, conexao simulada, revisao e confirmacao.

Antes da confirmacao, a cotacao e revalidada. Cada tentativa confirmada gera uma `idempotencyKey`; reenvios com a mesma chave recuperam o mesmo pedido. Isso evita duplicidade em clique repetido, timeout, refresh ou reconexao.

Pedidos nascem `pendente` e sao liquidados pelo mock conforme o cenario (`confirmado`, `recusado` ou `pendente`). O recibo e snapshot imutavel: alteracoes futuras no catalogo nao mudam valores do pedido.

## Cache e sincronizacao

TanStack Query separa estado remoto de estado local. As chaves incluem parametros e dono do dado quando necessario, como carrinho/cotacao por usuario ou visitante.

Politica padrao:

- `staleTime`: 45 s.
- `retry`: 1.
- Invalidacao apos mutations relevantes.
- Atualizacao otimista em favoritos, com rollback em falha.
- Revalidacao de recursos ativos apos reconexao do tempo real.

Respostas REST antigas nao devem sobrescrever eventos mais novos quando ha versao do recurso disponivel.

## Tempo real

O cliente usa `socket.io-client`, transporte `websocket`, caminho `/realtime` e token no handshake `auth`.

Eventos:

- `nft.updated`: atualiza preco/disponibilidade no catalogo, detalhe e carrinho.
- `order.updated`: atualiza status do pedido e a tela de confirmacao.

Cada evento carrega:

- `id`: descarta duplicatas.
- `resource`: identifica o recurso afetado.
- `version`: descarta eventos antigos.
- `occurredAt`: registro temporal.
- `audience`: restringe eventos privados, como pedidos.

Ao reconectar, queries ativas de NFTs, carrinho, cotacao e pedido sao invalidadas para reconciliar com REST.

## MSW e limitacoes do mock

MSW intercepta REST e WebSocket. O mock de Socket.IO implementa apenas o minimo usado pelo app:

- Engine.IO open/ping/pong/close.
- Socket.IO connect/disconnect/event.
- Sem polling HTTP.
- Sem mensagens binarias.
- Sem acknowledgements.
- Sem namespaces alem de `/`.
- Sem broadcast entre abas, porque o estado roda no contexto da pagina.

O `socket.io-client` e importado dinamicamente depois do `worker.start()` para garantir que o engine.io use o WebSocket interceptado pelo MSW.

## Acessibilidade e responsividade

A interface foi revisada para 390, 768 e 1440 px. Ha skip link, foco visivel, labels associados, erros por campo, live regions para feedbacks, controle de foco em dialog e suporte a `prefers-reduced-motion`.

Perfil, carteiras e confirmacao funcionam em mobile mesmo sem frame especifico no Figma.

## Assets e Figma

O projeto usa imagens locais em `src/assets` para manter execucao offline/reprodutivel. Onde o Figma nao define estados especificos, os estados de loading, vazio, erro e sucesso seguem a linguagem visual do restante da interface.

## Testes

Playwright cobre fluxos principais, cenarios de falha, tempo real, acessibilidade basica, responsividade e regressao visual. Cada teste reseta o mock para um estado conhecido.

Projetos configurados:

- `chromium-desktop`: 1440 x 1000.
- `chromium-mobile`: 390 x 844.

## Lighthouse

`npm run lighthouse` executa build com MSW, sobe preview local e gera 3 medicoes para:

- inicio mobile;
- inicio desktop;
- detalhe mobile;
- detalhe desktop.

Os arquivos ficam em `reports/lighthouse`, incluindo `summary.json` com medianas das categorias e metricas LCP, CLS e TBT.
