# Checklist de entrega e decisoes tecnicas

Este arquivo consolida o que o desafio pede, o que ja esta pronto neste projeto, o que ainda falta evidenciar ou implementar, e quais decisoes tecnicas devem ser defendidas na entrega.

Fonte do desafio: https://github.com/junglegaming/frontend-challenge

Legenda:

- `[x]` pronto no projeto.
- `[~]` implementado, mas ainda precisa de revisao, evidencia ou documentacao final.
- `[ ]` pendente.

## 1. Leitura do desafio

O teste pede um marketplace de NFTs em React e TypeScript com fluxos reais de descoberta, compra e conta do colecionador. Nao basta montar telas estaticas: a avaliacao considera integracao com APIs simuladas, estado assincrono, tempo real, acessibilidade, performance, testes e documentacao.

Pontos eliminatorios citados no enunciado:

- Ausencia de uso efetivo da stack obrigatoria.
- Fluxos principais apenas visuais.
- Compra confirmada sem resposta da simulacao.
- Vazamento de dados entre usuarios.
- Eventos simulados diretamente na UI em vez de passar por Socket.IO.
- Ausencia de testes E2E executaveis.

## 2. Status geral

### Stack obrigatoria

- [x] React.
- [x] TypeScript.
- [x] TanStack Router para rotas, search params e rotas privadas.
- [x] TanStack Query para queries, mutations, cache e invalidacoes.
- [x] Axios para chamadas REST.
- [x] REST APIs simuladas.
- [x] Socket.IO com `socket.io-client`.
- [x] Tailwind CSS.
- [~] Componentes no padrao shadcn/ui: existem componentes base proprios, mas falta documentar que foram adaptados ao visual do projeto.
- [x] MSW para REST e WebSocket mockado.
- [x] Playwright com E2E e regressao visual.
- [~] Lighthouse: script existe, mas faltam configuracao versionada, 3 medicoes por pagina/perfil e relatorios.

### Fluxos obrigatorios

- [x] Inicio/catalogo com destaques, busca, filtros, ordenacao e paginacao.
- [x] Detalhe do NFT com galeria, informacoes, quantidade, favoritos e compra.
- [x] Carrinho com edicao de quantidade, remocao, cupom e resumo de valores.
- [x] Pagamento com dados do colecionador, carteira, rede, revisao e envio.
- [x] Confirmacao de pedido com status, transacao simulada, itens, taxas e total.
- [x] Login, cadastro, logout e sessao recuperavel.
- [x] Perfil com edicao, avatar e senha.
- [x] Carteiras com principal/secundaria, cadastro, edicao e validacao.
- [~] Responsividade completa: ha testes em 390, 768 e 1440 px; ainda falta revisao visual final contra Figma.

## 3. O que ja esta forte

- [x] A aplicacao deixou de ser apenas visual: os fluxos passam por API simulada via Axios + MSW.
- [x] O catalogo usa URL como fonte de estado para busca, filtros, ordenacao e pagina.
- [x] O carrinho e a cotacao vem da API e usam valores de ETH como strings decimais.
- [x] O checkout revalida preco, disponibilidade, cupom e taxas antes de confirmar.
- [x] Pedidos usam idempotencia para evitar duplicidade em clique repetido, timeout, refresh ou reconexao.
- [x] O recibo e snapshot imutavel do pedido.
- [x] Favoritos usam atualizacao otimista com rollback em caso de falha.
- [x] Sessao expirada encerra a sessao local e preserva contexto de retorno.
- [x] Troca de usuario limpa cache privado e evita exposicao de dados da conta anterior.
- [x] Socket.IO passa pelo `socket.io-client` real e pelo mock de WebSocket do MSW.
- [x] Eventos `nft.updated` e `order.updated` carregam identidade, recurso e versao.
- [x] Eventos duplicados/antigos sao ignorados.
- [x] Reconexao invalida queries ativas para reconciliar com REST.
- [x] Playwright cobre catalogo, auth, carrinho, checkout, perfil, carteiras, realtime, acessibilidade e visual.

## 4. O que falta antes da entrega

### Documentacao obrigatoria

- [x] Criar `README.md` com setup, variaveis, credenciais ficticias, cenarios, comandos e fluxos de falha.
- [x] Criar `ARCHITECTURE.md` ou mover para ele as decisoes de arquitetura hoje espalhadas entre comentarios e `GUIA_EXPLICACAO_TECNICA.md`.
- [x] Documentar contratos REST e eventos em formato objetivo.
- [x] Documentar politica de sessao, carrinho, cache, retries e sincronizacao REST + Socket.IO.
- [x] Documentar limitacoes dos mocks de Socket.IO.
- [x] Documentar substituicoes de assets e desvios do Figma.

### Lighthouse e performance

- [x] Criar configuracao versionada de Lighthouse.
- [x] Rodar build otimizado e auditar inicio + detalhe.
- [x] Executar 3 medicoes por pagina em mobile e desktop.
- [x] Registrar mediana de Performance, Accessibility, Best Practices e SEO.
- [x] Registrar LCP, CLS e TBT.
- [x] Versionar relatorios HTML/JSON.
- [x] Justificar qualquer resultado abaixo da meta.

### Validacao final

- [x] Rodar `npm run build`.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run test:e2e`.
- [x] Conferir se os snapshots visuais continuam validos.
- [ ] Testar manualmente os fluxos principais no preview.
- [ ] Publicar deploy e garantir refresh/acesso direto das rotas.

### Acabamento de UI/acessibilidade

- [ ] Revisar fidelidade visual contra o Figma.
- [ ] Conferir contraste e estados que nao dependam apenas de cor.
- [ ] Conferir textos alternativos das imagens relevantes.
- [ ] Validar zoom sem perda de conteudo.
- [ ] Conferir skeletons/shimmer em todas as areas dependentes de dados.

## 5. Decisoes tecnicas e por que foram tomadas

### MSW na camada de rede

Decisao: simular backend com MSW, interceptando REST e WebSocket, sem colocar respostas falsas dentro de componentes ou hooks.

Por que: o desafio exige mocks na camada de rede. Isso deixa a UI mais parecida com uma aplicacao real, facilita testes E2E e permite trocar o backend simulado por uma API real com menos mudancas.

### Axios mesmo com mock

Decisao: toda chamada REST passa por Axios.

Por que: o enunciado exige Axios e REST APIs. Usar Axios preserva interceptors de sessao, tratamento padronizado de erro e separacao entre transporte e interface.

### TanStack Query para estado remoto

Decisao: catalogo, detalhe, sessao, carrinho, cotacao, perfil, carteiras e pedidos usam queries/mutations.

Por que: esses dados pertencem ao servidor, mesmo que o servidor seja simulado. Query resolve cache, retries, loading, erro, invalidacao e sincronizacao apos mutations/eventos.

### URL como estado do catalogo

Decisao: busca, filtros, ordenacao e pagina ficam nos search params.

Por que: o desafio pede que o estado sobreviva a refresh e historico. A URL tambem torna o catalogo compartilhavel e reduz estado local duplicado.

### ETH como string decimal

Decisao: valores monetarios trafegam como string decimal e a aritmetica critica usa BigInt em wei.

Por que: `number` pode introduzir erros de ponto flutuante. Em compra, cotacao e recibo, precisao e previsibilidade sao requisitos de produto.

### Carrinho como recurso remoto

Decisao: carrinho e cotacao sao recursos da API simulada, nao apenas `localStorage` na UI.

Por que: disponibilidade, cupom, taxa e total precisam vir da cotacao oficial. Isso tambem permite preservar carrinho de visitante e mesclar ao autenticar.

### Idempotencia no pedido

Decisao: cada tentativa confirmada de compra gera uma chave de idempotencia.

Por que: clique duplo, timeout, refresh e reconexao nao podem gerar compras duplicadas. A mesma tentativa deve recuperar o mesmo pedido.

### Recibo como snapshot

Decisao: o pedido confirmado salva titulo, edicao, preco, carteira, rede e colecionador no momento da compra.

Por que: mudancas futuras no catalogo nao podem alterar um recibo ja emitido.

### Socket.IO real no cliente

Decisao: usar `socket.io-client` e um mock compativel via WebSocket do MSW, em vez de chamar setters/cache diretamente.

Por que: o desafio diz que os cenarios devem exercitar `socket.io-client`. Isso valida ciclo de conexao, reconexao, eventos duplicados, eventos antigos e isolamento por sessao.

### Versao e identidade dos eventos

Decisao: eventos carregam `id`, `resource`, `version`, `occurredAt` e audiencia quando necessario.

Por que: `id` evita reaplicar duplicatas; `version` impede regressao de cache; audiencia evita evento privado de outro usuario.

### Import dinamico do Socket.IO

Decisao: carregar `socket.io-client` com `import()` depois do `worker.start()`.

Por que: o engine.io-client captura `globalThis.WebSocket` quando o modulo e avaliado. O import dinamico garante que ele use o WebSocket interceptado pelo MSW.

### Playwright com cenarios deterministas

Decisao: testes controlam reset, latencia, falhas, tempo e disparo de eventos por endpoints de mock.

Por que: cenarios como timeout, pagamento recusado, evento antigo e sessao expirada precisam ser reproduziveis para avaliacao e debug.

## 6. Checklist para limpar comentarios do codigo

Objetivo: reduzir comentarios no codigo antes da entrega, mantendo apenas os que evitam mal-entendido tecnico. Comentarios de decisao devem ir para `ARCHITECTURE.md`, `README.md` ou este arquivo.

### Comentarios que podem virar documentacao e sair do codigo

- [x] `src/contracts/api.ts`: explicacoes de contrato podem migrar para uma secao "Contratos REST e eventos".
- [x] `src/lib/eth.ts`: motivo de BigInt/wei pode migrar para "Valores ETH".
- [x] `src/lib/socket.ts`: motivo do import dinamico pode migrar para "Tempo real e MSW".
- [x] `src/mocks/realtime.ts`: detalhes do protocolo podem migrar para "Limitacoes do mock Socket.IO".
- [~] `src/modules/realtime/cache.ts`: regra de versao/reconciliacao pode migrar para "Sincronizacao REST + Socket.IO".
- [~] `src/modules/checkout/useCheckoutFlow.ts`: idempotencia, tentativa pendente e revalidacao podem migrar para "Checkout e pedidos".
- [~] `src/modules/cart/CartProvider.tsx`: isolamento por dono e ressincronizacao podem migrar para "Carrinho e cache".
- [~] `src/mocks/state.ts`: regras de negocio do mock podem migrar para "Estado simulado".

### Comentarios que podem ser removidos sem perda apos revisar o trecho

- [x] Comentarios em specs E2E que apenas explicam o passo seguinte.
- [x] Comentarios sobre valores esperados de teste quando o `expect` ja comunica a intencao.
- [ ] Comentarios em handlers que repetem exatamente o nome da rota.
- [ ] Comentarios de "ignore" em `catch` se o bloco puder ser autoexplicativo.
- [ ] Comentarios sobre campos obvios de formulario ou UI.

### Comentarios que provavelmente devem ficar

- [ ] `eslint-disable-next-line` com justificativa em `useCheckoutFlow.ts`.
- [ ] Comentarios curtos que explicam workaround tecnico nao obvio, especialmente MSW + Socket.IO.
- [ ] Comentarios de acessibilidade quando explicam foco, live region ou comportamento de dialog.
- [ ] Comentarios de seguranca/isolamento de sessao quando previnem regressao grave.

## 7. Ordem recomendada para finalizar

1. Rodar `npm run build`, `npm run lint`, `npm run typecheck` e `npm run test:e2e`.
2. Corrigir falhas de teste ou lint antes de mexer em documentacao.
3. Criar `README.md` com comandos, credenciais e cenarios.
4. Criar `ARCHITECTURE.md` com as decisoes da secao 5.
5. Remover comentarios redundantes do codigo usando a secao 6 como guia.
6. Rodar testes novamente.
7. Executar Lighthouse com build otimizado.
8. Versionar relatorios e registrar resultados.
9. Fazer revisao visual final contra Figma.
10. Publicar deploy e validar refresh/acesso direto.

## 8. Resumo para entrevista

Frase curta:

"Eu tratei o desafio como uma aplicacao frontend real: a UI conversa com uma API simulada por MSW via Axios, o estado remoto e gerenciado por TanStack Query, o catalogo fica navegavel pela URL, o checkout usa cotacao oficial e idempotencia, e o tempo real passa pelo `socket.io-client` com tolerancia a duplicatas, eventos antigos e reconexao."

Pontos para defender:

- Nao ha compra confirmada sem resposta da simulacao.
- O recibo e imutavel.
- Dados privados sao isolados por usuario.
- Os mocks sao deterministas e usados por desenvolvimento, demo e testes.
- Os cenarios criticos estao cobertos por Playwright.
- A principal pendencia de entrega agora e evidencia: README, Architecture, Lighthouse, deploy e limpeza final.
