# Plano de desenvolvimento - NFT Marketplace

Este arquivo e o checklist vivo para finalizar o desafio tecnico. Ele deve guiar a implementacao parte por parte, sempre validando uma camada antes de seguir para a proxima.

## Estado atual do projeto

O projeto ja possui uma base visual navegavel em React, TypeScript, Tailwind, TanStack Router e TanStack Query. As principais telas existem e o build esta funcionando.

Porem, a maior parte das regras do desafio ainda precisa ser implementada de forma integrada. Hoje muitas telas usam arrays locais, dados fixos, `localStorage` direto ou comportamento apenas visual. O objetivo das proximas fases e transformar o prototipo em uma aplicacao funcional com API REST simulada, MSW, TanStack Query, sessao, carrinho, checkout, Socket.IO, testes e Lighthouse.

## Referencias

- Escopo do desafio: texto colado no chat e anexo local do Codex.
- Figma: https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1&p=f
- Guia tecnico existente: `GUIA_EXPLICACAO_TECNICA.md`

## Objetivo final

Entregar os fluxos de descoberta, compra e conta do colecionador, com versoes desktop e mobile, usando dados simulados por API. Nao ha integracao real com blockchain, extensoes de carteira ou gateway de pagamento.

Fluxos obrigatorios:

- Inicio/catalogo.
- Detalhe do NFT.
- Carrinho.
- Pagamento.
- Confirmacao de pedido.
- Login.
- Cadastro.
- Perfil do colecionador.
- Carteiras.

## Stack obrigatoria e status real

- [x] React.
- [x] TypeScript.
- [x] TanStack Router instalado e usado em rotas basicas.
- [~] TanStack Query instalado e usado parcialmente.
- [~] Axios configurado, mas ainda pouco usado.
- [ ] REST APIs simuladas usadas pela aplicacao.
- [ ] Socket.IO funcional.
- [x] Tailwind CSS.
- [~] Componentes base no estilo shadcn/ui.
- [ ] MSW funcional na camada de rede.
- [ ] Playwright configurado com testes reais.
- [ ] Lighthouse com auditorias e relatorios versionados.

Legenda:

- `[x]` concluido.
- `[~]` existe parcialmente, mas ainda nao cumpre o requisito.
- `[ ]` pendente.

## Regras de trabalho

1. Fazer uma fase por vez.
2. Evitar refatoracoes fora do escopo da fase.
3. Migrar dados locais para REST/MSW gradualmente.
4. Usar TanStack Query para estado remoto e mutations.
5. Usar TanStack Router para rotas, search params e protecao.
6. Usar Axios para todas as chamadas REST.
7. Validar com `npm run build` ao final de cada fase relevante.
8. Atualizar este arquivo quando uma fase for concluida.

## Ordem recomendada

A ordem abaixo evita retrabalho. A API simulada vem antes do carrinho e do checkout porque quase todos os requisitos dependem dela.

---

## Fase 0 - Base visual existente

Status: concluida parcialmente

Objetivo: registrar o que ja existe antes da migracao funcional.

Ja existe:

- [x] Projeto React + TypeScript + Vite.
- [x] Tailwind configurado.
- [x] Layout principal.
- [x] Rotas principais com TanStack Router.
- [x] QueryClient configurado.
- [x] Cliente Axios criado.
- [x] Pagina inicial/catalogo visual.
- [x] Pagina de detalhe visual.
- [x] Pagina de carrinho visual.
- [x] Pagina de pagamento visual.
- [x] Pagina de confirmacao visual.
- [x] Pagina de login visual.
- [x] Pagina de cadastro visual.
- [x] Pagina de perfil visual.
- [x] Pagina de carteiras visual.
- [x] Build de producao funcionando.

Pendencias herdadas desta fase:

- [ ] Remover textos que denunciam prototipo ou "primeira fase".
- [ ] Revisar fidelidade ao Figma quando assets/prints estiverem disponiveis.
- [ ] Trocar fallbacks visuais por dados reais da API simulada.

---

## Fase 1 - Fundacao REST, MSW e contratos

Status: pendente

Dificuldade estimada: alta

Objetivo: criar a base de backend simulado que sera usada por todas as telas.

Arquivos/pastas esperados:

- `src/contracts/`
- `src/lib/api.ts`
- `src/mocks/`
- `src/mocks/fixtures/`
- `src/mocks/handlers/`
- `src/mocks/browser.ts`
- `src/mocks/server.ts`

Itens:

- [ ] Definir contratos TypeScript para request, response e erros.
- [ ] Padronizar formato de erro da API.
- [ ] Configurar MSW no browser.
- [ ] Ativar MSW por configuracao no ambiente de desenvolvimento/demo.
- [ ] Garantir que componentes/hooks nao tenham respostas ficticias internas.
- [ ] Criar fixtures com variedade suficiente para filtros e paginacao.
- [ ] Criar pelo menos dois usuarios.
- [ ] Criar estado mockado consistente entre catalogo, favoritos, carrinho, perfil, carteiras e pedidos.
- [ ] Criar persistencia local opcional para refresh.
- [ ] Criar reset completo para cenario conhecido.
- [ ] Criar handlers REST para sessao e conta.
- [ ] Criar handlers REST para NFTs.
- [ ] Criar handlers REST para favoritos.
- [ ] Criar handlers REST para carrinho.
- [ ] Criar handlers REST para cotacao.
- [ ] Criar handlers REST para pedidos.
- [ ] Criar handlers REST para perfil.
- [ ] Criar handlers REST para carteiras.
- [ ] Simular sucesso e resultado vazio.
- [ ] Simular latencia variavel.
- [ ] Simular respostas fora de ordem.
- [ ] Simular falhas de conexao.
- [ ] Simular respostas HTTP 4xx/5xx.
- [ ] Simular sessao expirada e acesso nao autorizado.
- [ ] Simular conflito de cadastro.
- [ ] Simular erros de validacao.
- [ ] Simular cupom invalido ou expirado.
- [ ] Simular preco alterado ou edicao esgotada durante compra.
- [ ] Simular timeout apos criacao de pedido.
- [ ] Simular pagamento confirmado.
- [ ] Simular pagamento recusado.

Criterio de pronto:

- A aplicacao consegue fazer chamadas Axios interceptadas pelo MSW.
- Os handlers retornam dados consistentes.
- Existe forma de resetar os mocks.
- `npm run build` passa.

---

## Fase 2 - Sessao, autenticacao e rotas privadas

Status: pendente

Dificuldade estimada: alta

Objetivo: implementar conta, sessao e protecao dos fluxos privados.

Itens:

- [ ] Criar queries/mutations de sessao com TanStack Query.
- [ ] Implementar cadastro via API simulada.
- [ ] Implementar login via API simulada.
- [ ] Implementar logout via API simulada.
- [ ] Recuperar sessao apos refresh.
- [ ] Tratar sessao expirada durante navegacao.
- [ ] Tratar sessao expirada durante checkout.
- [ ] Proteger checkout, perfil, carteiras, favoritos e pedidos.
- [ ] Preservar rota de retorno apos login.
- [ ] Preservar carrinho visitante ao autenticar.
- [ ] Limpar cache privado no logout.
- [ ] Limpar cache privado na troca de usuario.
- [ ] Liberar subscriptions da sessao anterior.
- [ ] Validar formularios de login e cadastro.
- [ ] Tratar conflito de cadastro.
- [ ] Evitar armazenamento de senha em claro.

Criterio de pronto:

- Usuario consegue cadastrar, logar, sair e recarregar a pagina mantendo sessao.
- Rotas privadas redirecionam para login e retornam ao fluxo anterior.
- Troca de usuario nao vaza dados do usuario anterior.

---

## Fase 3 - Catalogo, detalhe e favoritos

Status: pendente

Dificuldade estimada: alta

Objetivo: migrar descoberta e detalhe para REST + TanStack Query, mantendo estado navegavel na URL.

Itens:

- [ ] Migrar listagem de NFTs para API.
- [ ] Usar Axios no client de NFTs.
- [ ] Usar TanStack Query com `queryKey` por parametros.
- [ ] Manter busca na URL.
- [ ] Manter filtros na URL.
- [ ] Manter ordenacao na URL.
- [ ] Manter paginacao na URL.
- [ ] Restaurar estado apos refresh.
- [ ] Restaurar estado pelo historico do navegador.
- [ ] Permitir filtros combinaveis.
- [ ] Reiniciar paginacao ao mudar filtro.
- [ ] Tratar resultado vazio.
- [ ] Tratar falha de listagem.
- [ ] Descartar/cancelar respostas obsoletas.
- [ ] Migrar detalhe do NFT para API.
- [ ] Suportar acesso direto ao detalhe.
- [ ] Tratar NFT inexistente.
- [ ] Tratar edicao indisponivel.
- [ ] Respeitar limite de quantidade.
- [ ] Implementar favoritos por usuario autenticado.
- [ ] Persistir favoritos por usuario.
- [ ] Implementar atualizacao otimista em favoritos.
- [ ] Implementar rollback em falha de favorito.
- [ ] Adicionar skeletons com shimmer no catalogo e detalhe.

Criterio de pronto:

- Catalogo e detalhe nao dependem mais de arrays locais.
- Busca/filtros/ordenacao/paginacao sobrevivem a refresh e historico.
- Favoritos funcionam com usuario autenticado e rollback em falha.

---

## Fase 4 - Carrinho e cotacao

Status: pendente

Dificuldade estimada: alta

Objetivo: transformar o carrinho em recurso remoto simulado, com cotacao oficial da API.

Itens:

- [ ] Migrar carrinho de `localStorage` direto para API simulada.
- [ ] Consultar carrinho via TanStack Query.
- [ ] Adicionar item via mutation.
- [ ] Alterar quantidade via mutation.
- [ ] Remover item via mutation.
- [ ] Respeitar disponibilidade por NFT e edicao.
- [ ] Manter carrinho apos refresh.
- [ ] Preservar carrinho visitante ao autenticar.
- [ ] Mesclar carrinho anonimo com carrinho do usuario.
- [ ] Aplicar cupom via API.
- [ ] Remover cupom via API.
- [ ] Tratar cupom invalido.
- [ ] Tratar cupom expirado.
- [ ] Consultar cotacao da API.
- [ ] Exibir subtotal, desconto, taxa de rede e total da resposta da API.
- [ ] Manter valores ETH como strings decimais no transporte.
- [ ] Usar calculo preciso para apresentacao.
- [ ] Evitar uso de `number` para regras monetarias.
- [ ] Refletir alteracoes de preco/disponibilidade no carrinho.
- [ ] Adicionar skeleton no resumo do carrinho.

Criterio de pronto:

- Carrinho persiste, respeita estoque, trata cupom e mostra totais coerentes com a API.
- Nenhum calculo critico de ETH depende de float comum.

---

## Fase 5 - Checkout, pagamento e pedidos

Status: pendente

Dificuldade estimada: alta

Objetivo: implementar pagamento simulado com revisao, idempotencia, recuperacao e recibo snapshot.

Itens:

- [ ] Migrar checkout para dados reais da sessao, perfil, carteiras e carrinho.
- [ ] Validar campos do layout.
- [ ] Usar carteiras cadastradas.
- [ ] Selecionar carteira.
- [ ] Selecionar rede.
- [ ] Simular conexao de carteira.
- [ ] Simular recusa de conexao.
- [ ] Simular desconexao.
- [ ] Exibir revisao antes do envio.
- [ ] Revalidar preco, disponibilidade, cupom e taxas antes de criar pedido.
- [ ] Exigir nova confirmacao quando a cotacao mudar.
- [ ] Gerar chave de idempotencia por tentativa de compra.
- [ ] Criar pedido por mutation.
- [ ] Impedir clique repetido de gerar pedidos duplicados.
- [ ] Recuperar mesmo pedido apos timeout.
- [ ] Recuperar pedido apos refresh.
- [ ] Representar pedido pendente.
- [ ] Representar pedido confirmado.
- [ ] Representar pedido recusado.
- [ ] Exibir confirmacao somente para pedido confirmado.
- [ ] Preservar itens do carrinho em falhas.
- [ ] Apos confirmacao, remover apenas itens e quantidades comprados.
- [ ] Gerar recibo como snapshot imutavel.
- [ ] Simular referencia de transacao.
- [ ] Simular link de explorador.

Criterio de pronto:

- Compra completa funciona do catalogo ao recibo.
- Reenvio, clique repetido e timeout nao duplicam pedido.
- Recibo nao muda se o catalogo mudar depois.

---

## Fase 6 - Perfil e carteiras

Status: pendente

Dificuldade estimada: media

Objetivo: concluir a area da conta do colecionador integrada a API.

Itens:

- [ ] Consultar perfil via API.
- [ ] Editar dados do perfil.
- [ ] Simular alteracao de avatar.
- [ ] Alterar senha.
- [ ] Validar formulario de perfil.
- [ ] Validar formulario de senha.
- [ ] Tratar erros retornados pela API.
- [ ] Consultar carteiras via API.
- [ ] Cadastrar carteira principal.
- [ ] Cadastrar carteira secundaria.
- [ ] Editar carteiras.
- [ ] Validar endereco de carteira.
- [ ] Validar rede.
- [ ] Persistir alteracoes apos refresh.
- [ ] Garantir funcionamento mobile mesmo sem frame especifico.

Criterio de pronto:

- Usuario autenticado consegue editar perfil, avatar, senha e carteiras com persistencia.

---

## Fase 7 - Tempo real com Socket.IO

Status: pendente

Dificuldade estimada: alta

Objetivo: implementar eventos em tempo real passando por `socket.io-client` e mocks compativeis.

Itens:

- [ ] Configurar `socket.io-client`.
- [ ] Configurar mock Socket.IO compativel com MSW.
- [ ] Documentar transporte usado.
- [ ] Documentar limitacoes dos mocks de tempo real.
- [ ] Implementar evento `nft.updated`.
- [ ] Implementar evento `order.updated`.
- [ ] Eventos devem carregar identidade estavel.
- [ ] Eventos devem carregar recurso afetado.
- [ ] Eventos devem carregar versao.
- [ ] Atualizar preco/disponibilidade no catalogo.
- [ ] Atualizar preco/disponibilidade no detalhe.
- [ ] Atualizar preco/disponibilidade no carrinho.
- [ ] Atualizar estado do pedido.
- [ ] Apresentar confirmacao por `order.updated`.
- [ ] Apresentar recusa por `order.updated`.
- [ ] Ignorar eventos duplicados.
- [ ] Ignorar eventos antigos.
- [ ] Reconciliar recursos ativos com REST apos reconexao.
- [ ] Impedir eventos de sessao anterior de atualizarem usuario atual.
- [ ] Liberar listeners ao desmontar/encerrar sessao.
- [ ] Implementar cenario de NFT no carrinho que muda preco/disponibilidade.
- [ ] Impedir checkout com cotacao desatualizada.
- [ ] Recuperar pedido pendente apos interrupcao de conexao ou reload.

Criterio de pronto:

- Tempo real passa por `socket.io-client`.
- Eventos nao corrompem estado e nao vazam entre sessoes.

---

## Fase 8 - Responsividade, acessibilidade e acabamento visual

Status: pendente

Dificuldade estimada: media/alta

Objetivo: deixar a interface pronta para avaliacao visual, mobile e acessibilidade.

Itens:

- [ ] Revisar desktop em 1440px.
- [ ] Revisar tablet em 768px.
- [ ] Revisar mobile em 390px.
- [ ] Garantir filtros usaveis em mobile.
- [ ] Garantir carrinho usavel em mobile.
- [ ] Garantir checkout usavel em mobile.
- [ ] Garantir perfil e carteiras em mobile.
- [ ] Implementar skeletons com shimmer onde faltar.
- [ ] Preservar dimensoes para evitar layout shift.
- [ ] Respeitar `prefers-reduced-motion`.
- [ ] Garantir navegacao por teclado.
- [ ] Garantir foco visivel.
- [ ] Controlar foco em dialogs/drawers.
- [ ] Associar labels e mensagens de erro.
- [ ] Adicionar alternativas textuais para imagens relevantes.
- [ ] Garantir contraste legivel.
- [ ] Evitar estados dependentes apenas de cor.
- [ ] Criar feedback acessivel para mutations.
- [ ] Criar feedback acessivel para eventos em tempo real.
- [ ] Corrigir overflow horizontal.
- [ ] Corrigir perda de conteudo com zoom.
- [ ] Adaptar componentes base ao visual do projeto.
- [ ] Documentar substituicoes de assets.
- [ ] Documentar ajustes de acessibilidade em relacao ao layout.

Criterio de pronto:

- Fluxos principais funcionam bem em 390, 768 e 1440px.
- A UI e navegavel por teclado e apresenta feedback acessivel.

---

## Fase 9 - Playwright e regressao visual

Status: pendente

Dificuldade estimada: alta

Objetivo: cobrir os fluxos obrigatorios com E2E executavel usando mocks.

Itens:

- [ ] Criar `playwright.config`.
- [ ] Criar setup de reset dos mocks por teste.
- [ ] Controlar relogio nos testes sensiveis a tempo.
- [ ] Controlar latencia nos cenarios sensiveis.
- [ ] Controlar disparo de eventos nos cenarios de Socket.IO.
- [ ] Testar busca, filtros combinados, ordenacao e paginacao.
- [ ] Testar restauracao pelo historico.
- [ ] Testar acesso direto ao detalhe.
- [ ] Testar NFT inexistente.
- [ ] Testar cadastro.
- [ ] Testar login.
- [ ] Testar expiracao de sessao.
- [ ] Testar logout.
- [ ] Testar troca de usuario.
- [ ] Testar favoritos com falha e rollback.
- [ ] Testar carrinho, quantidades e remocao.
- [ ] Testar cupom.
- [ ] Testar persistencia apos refresh/login.
- [ ] Testar compra completa ate recibo confirmado.
- [ ] Testar pagamento recusado.
- [ ] Testar clique repetido.
- [ ] Testar timeout e recuperacao do mesmo pedido.
- [ ] Testar edicao de perfil.
- [ ] Testar avatar.
- [ ] Testar senha.
- [ ] Testar carteiras.
- [ ] Testar alteracao de preco/disponibilidade via Socket.IO.
- [ ] Testar eventos duplicados/antigos.
- [ ] Testar desconexao e retomada de pedido pendente.
- [ ] Testar navegacao por teclado.
- [ ] Testar foco de dialogs.
- [ ] Testar validacao de formularios.
- [ ] Testar skeletons em carregamento lento.
- [ ] Testar feedback de falha e nova tentativa.
- [ ] Executar em Chromium desktop.
- [ ] Executar em Chromium mobile.
- [ ] Criar regressao visual de inicio.
- [ ] Criar regressao visual de detalhe.
- [ ] Criar regressao visual de carrinho.
- [ ] Criar regressao visual de pagamento.
- [ ] Versionar baselines visuais.
- [ ] Gerar relatorio HTML.
- [ ] Guardar traces das falhas.

Criterio de pronto:

- `npm run test:e2e` executa os fluxos principais com dados isolados.
- Testes de REST passam por MSW e testes de tempo real passam por Socket.IO.

---

## Fase 10 - Lighthouse, documentacao e entrega

Status: pendente

Dificuldade estimada: media/alta

Objetivo: preparar a entrega final com auditoria, relatorios e explicacao tecnica.

Itens:

- [ ] Criar configuracao versionada de Lighthouse.
- [ ] Rodar build otimizado.
- [ ] Auditar pagina inicial em desktop.
- [ ] Auditar pagina inicial em mobile.
- [ ] Auditar detalhe do NFT em desktop.
- [ ] Auditar detalhe do NFT em mobile.
- [ ] Executar 3 medicoes por pagina/perfil.
- [ ] Reportar mediana de Performance.
- [ ] Reportar mediana de Accessibility.
- [ ] Reportar mediana de Best Practices.
- [ ] Reportar mediana de SEO.
- [ ] Registrar LCP.
- [ ] Registrar CLS.
- [ ] Registrar TBT.
- [ ] Versionar relatorios HTML.
- [ ] Versionar relatorios JSON.
- [ ] Registrar versoes das ferramentas.
- [ ] Registrar ambiente e condicoes de execucao.
- [ ] Justificar resultados abaixo das metas, se houver.
- [ ] Documentar contratos REST.
- [ ] Documentar politica de cache, retries e sincronizacao.
- [ ] Documentar cenarios MSW.
- [ ] Documentar transporte Socket.IO e limitacoes.
- [ ] Documentar setup local.
- [ ] Documentar comandos de teste.
- [ ] Revisar `GUIA_EXPLICACAO_TECNICA.md`.

Criterio de pronto:

- Projeto esta demonstravel, testado, auditado e explicavel em entrevista.

---

## Checklist por fluxo

### Descoberta e catalogo

- [ ] Destaques.
- [ ] Catalogo.
- [ ] Busca.
- [ ] Filtros.
- [ ] Ordenacao.
- [ ] Paginacao.
- [ ] Estado na URL.
- [ ] Refresh preserva estado.
- [ ] Historico preserva estado.
- [ ] Resultado vazio.
- [ ] Erro de API.
- [ ] Respostas fora de ordem.

### Detalhe do NFT

- [ ] Galeria.
- [ ] Informacoes.
- [ ] Edicao.
- [ ] Quantidade.
- [ ] Limite de disponibilidade.
- [ ] Favoritos.
- [ ] Compra/adicionar ao carrinho.
- [ ] Acesso direto.
- [ ] NFT inexistente.
- [ ] Edicao indisponivel.

### Carrinho

- [ ] Adicionar item.
- [ ] Alterar quantidade.
- [ ] Remover item.
- [ ] Persistencia apos refresh.
- [ ] Preservar visitante ao login.
- [ ] Cupom valido.
- [ ] Cupom invalido.
- [ ] Cupom expirado.
- [ ] Subtotal.
- [ ] Desconto.
- [ ] Taxa de rede.
- [ ] Total.
- [ ] Atualizacao em tempo real.
- [ ] ETH como string decimal.

### Pagamento e confirmacao

- [ ] Dados do colecionador.
- [ ] Carteira cadastrada.
- [ ] Selecao de rede.
- [ ] Conexao simulada.
- [ ] Recusa simulada.
- [ ] Desconexao simulada.
- [ ] Revisao.
- [ ] Revalidacao.
- [ ] Idempotencia.
- [ ] Pedido pendente.
- [ ] Pedido confirmado.
- [ ] Pedido recusado.
- [ ] Recuperacao apos refresh.
- [ ] Recibo snapshot.
- [ ] Transacao simulada.

### Conta

- [ ] Cadastro.
- [ ] Login.
- [ ] Logout.
- [ ] Sessao recuperavel.
- [ ] Sessao expirada.
- [ ] Rotas privadas.
- [ ] Perfil.
- [ ] Avatar.
- [ ] Senha.
- [ ] Carteiras.
- [ ] Validacoes.
- [ ] Erros da API.

### Tempo real

- [ ] `nft.updated`.
- [ ] `order.updated`.
- [ ] Duplicatas ignoradas.
- [ ] Eventos antigos ignorados.
- [ ] Reconciliacao apos reconexao.
- [ ] Isolamento por usuario.
- [ ] Listeners liberados.

### Qualidade

- [ ] Skeletons.
- [ ] Responsivo 390px.
- [ ] Responsivo 768px.
- [ ] Responsivo 1440px.
- [ ] Acessibilidade.
- [ ] Playwright.
- [ ] Regressao visual.
- [ ] Lighthouse.
- [ ] Documentacao final.

## Decisoes tecnicas pendentes

- [ ] Confirmar acesso aos assets ou prints do Figma.
- [ ] Definir biblioteca de validacao de formularios. Sugestao: Zod + React Hook Form, se fizer sentido para o prazo.
- [ ] Definir biblioteca para precisao decimal. Sugestao: decimal.js.
- [ ] Definir formato do reset de mocks: endpoint interno, helper de teste ou ambos.
- [ ] Definir se o build demo deve sempre iniciar MSW ou depender de variavel de ambiente.
- [ ] Definir estrategia para simular Socket.IO no ambiente de browser/teste.
- [ ] Definir onde salvar relatorios Lighthouse e Playwright.

## Proxima acao recomendada

Comecar pela Fase 1: fundacao REST, MSW e contratos. Ela desbloqueia sessao, catalogo, carrinho, checkout, perfil, carteiras, testes e cenarios de erro.
