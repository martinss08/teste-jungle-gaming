# Guia de explicacao tecnica - NFT Marketplace

Este arquivo serve como material de estudo e apoio para explicar o projeto em uma entrevista tecnica.

A ideia nao e decorar respostas, mas entender o motivo das decisoes e conseguir defender as escolhas com clareza.

## 1. Visao geral do projeto

O projeto e um marketplace de NFTs desenvolvido em React e TypeScript. Ele simula uma experiencia completa de compra: descoberta de NFTs, detalhe do item, favoritos, carrinho, checkout, autenticacao, perfil, carteiras e confirmacao de pedido.

Como o teste nao exige integracao real com blockchain, carteira externa ou gateway de pagamento, essas partes sao simuladas por uma API mockada. Mesmo assim, a aplicacao deve se comportar como se estivesse falando com um backend real.

### Como explicar

"Eu organizei o projeto como uma aplicacao frontend real, separando interface, rotas, estado remoto, contratos de API e mocks. O objetivo foi nao criar apenas telas estaticas, mas sim fluxos que tratam carregamento, erro, sessao, carrinho, pagamento e atualizacoes em tempo real."

### Perguntas provaveis

- O que esta simulado e o que seria real em producao?
- Por que nao integrar diretamente com blockchain?
- Como voce separou regras de negocio da interface?
- Como o projeto poderia evoluir para usar uma API real?

## 2. Layout e experiencia visual

O layout deve seguir o Figma fornecido no desafio. A primeira fase do projeto prioriza criar telas navegaveis e responsivas antes de implementar toda a regra de negocio.

Essa escolha ajuda a validar rapidamente a experiencia do usuario, a estrutura das telas e a navegacao entre fluxos.

### Como explicar

"Eu comecei pelo layout navegavel porque isso reduz incerteza visual e ajuda a enxergar o fluxo completo. Mesmo usando dados simples no inicio, mantive a estrutura preparada para trocar os mocks locais por chamadas REST depois."

### Pontos importantes

- Fidelidade visual ao Figma.
- Responsividade para desktop, tablet e mobile.
- Componentes reutilizaveis.
- Estados de loading, vazio e erro.
- Skeletons para evitar saltos de layout.
- Acessibilidade desde os componentes base.

### Perguntas provaveis

- Como voce garantiu fidelidade ao Figma?
- Como decidiu quebrar a interface em componentes?
- Como tratou mobile quando nao havia frame especifico?
- Como evitou duplicacao visual?

## 3. React e TypeScript

React e usado para construir a interface por componentes. TypeScript ajuda a deixar contratos, propriedades e respostas de API mais seguros.

No contexto deste teste, TypeScript e importante porque ha muitos fluxos com dados sensiveis: carrinho, cotacao, pedido, sessao e perfil.

### Como explicar

"Usei TypeScript para reduzir erros entre a camada de API, estado e interface. Como o projeto tem varios recursos relacionados, os tipos ajudam a garantir que carrinho, pedido e cotacao estejam sempre coerentes."

### Perguntas provaveis

- Onde TypeScript mais ajudou no projeto?
- Como voce modelou os tipos de NFT, carrinho e pedido?
- Voce usou tipos manuais ou schemas de validacao?
- Como evitar tipos duplicados entre mock e cliente?

## 4. TanStack Router

TanStack Router e responsavel pelas rotas da aplicacao. Ele tambem sera usado para search params, especialmente no catalogo.

O requisito diz que busca, filtros, ordenacao e paginacao devem compor o estado da URL. Isso permite refresh, compartilhamento de link e navegacao correta pelo historico.

### Como explicar

"Usei o roteador nao apenas para trocar paginas, mas tambem para controlar o estado navegavel do catalogo. Filtros, busca, ordenacao e pagina ficam na URL, entao o usuario pode atualizar a pagina ou voltar no historico sem perder o contexto."

### Perguntas provaveis

- Por que colocar filtros na URL?
- Como proteger rotas privadas?
- Como retornar ao checkout depois do login?
- Como tratar rota inexistente?

## 5. TanStack Query

TanStack Query gerencia estado remoto: consultas, cache, mutations, invalidacao, retries e estados de carregamento.

Ele e essencial porque o app simula um frontend falando com backend. Os dados nao devem ficar espalhados manualmente em varios estados locais.

### Como explicar

"Usei TanStack Query para separar estado remoto de estado local. Dados como catalogo, carrinho, sessao e pedidos sao consultados da API mockada e ficam em cache. Quando uma mutation muda algo, invalido ou atualizo as queries relacionadas."

### Pontos importantes

- Queries para leitura.
- Mutations para escrita.
- Cache por usuario e parametros.
- Invalidacao apos mudancas.
- Atualizacao otimista com rollback.
- Reconciliacao apos eventos de tempo real.

### Perguntas provaveis

- O que e estado remoto?
- Quando usar query e quando usar state local?
- Como voce evita dados obsoletos?
- Como funciona update otimista?
- Como limpar dados privados no logout?

## 6. Axios e contratos REST

Axios sera usado como cliente HTTP. A aplicacao deve consumir endpoints REST, mesmo que eles sejam interceptados pelo MSW.

Os contratos REST definem como frontend e backend conversam: formato de request, response e erros.

### Como explicar

"Mesmo usando MSW, eu mantive a aplicacao consumindo REST via Axios. Isso evita acoplar os componentes aos mocks e permite trocar a API simulada por uma API real com menos mudancas."

### Recursos principais

- Sessao e conta.
- NFTs.
- Favoritos.
- Carrinho.
- Cotacao.
- Pedidos.
- Perfil.
- Carteiras.

### Perguntas provaveis

- Como voce padronizou erros da API?
- Como tratou erro de validacao?
- Como tratou sessao expirada?
- Como documentou os contratos?
- Como garantir que mocks e frontend usam o mesmo contrato?

## 7. MSW

MSW intercepta chamadas de rede e responde como se fosse um backend. Isso permite desenvolver, demonstrar e testar sem backend real.

O enunciado exige que os mocks fiquem na camada de rede. Isso significa que componentes e hooks nao devem conter respostas falsas ou atalhos de negocio.

### Como explicar

"Usei MSW para simular o backend no nivel da rede. A aplicacao continua fazendo requests REST normais via Axios, mas o MSW responde com dados controlados. Assim consigo testar sucesso, erro, latencia, sessao expirada e conflitos sem alterar a UI."

### Pontos importantes

- Fixtures consistentes.
- Estado persistente entre refresh.
- Reset para cenario conhecido.
- Simulacao de erros.
- Simulacao de latencia.
- Cenarios deterministiscos para testes.

### Perguntas provaveis

- Por que MSW e melhor que mockar hooks diretamente?
- Como voce manteve consistencia entre carrinho, pedidos e catalogo?
- Como simular falhas de rede?
- Como resetar o estado para testes?

## 8. Carrinho

O carrinho e uma das partes mais importantes do teste. Ele precisa persistir apos refresh, respeitar disponibilidade, aplicar cupom e reagir a mudancas de preco ou estoque.

Valores em ETH devem trafegar como strings decimais para evitar perda de precisao.

### Como explicar

"Modelei o carrinho como um recurso remoto, nao apenas como estado local. Isso permite validar disponibilidade, cupom e totais com a API. Para valores em ETH, evitei number comum e mantive strings decimais, usando calculo preciso quando necessario."

### Pontos importantes

- Quantidades sao inteiras.
- Valores ETH como strings.
- Subtotal, desconto, taxa e total vem da cotacao.
- Carrinho visitante deve ser preservado ao login.
- Falhas de checkout nao removem itens.

### Perguntas provaveis

- Por que nao usar number para ETH?
- Como voce calcula total com precisao?
- O que acontece se o estoque mudar?
- Como mesclar carrinho anonimo com usuario logado?

## 9. Autenticacao e sessao

Login, cadastro, logout e recuperacao de sessao sao obrigatorios. Fluxos como checkout, favoritos, pedidos, perfil e carteiras exigem autenticacao.

Tambem e necessario tratar expiracao de sessao durante navegacao ou checkout.

### Como explicar

"A sessao foi tratada como parte central da aplicacao. Rotas privadas verificam autenticacao, e quando o usuario precisa fazer login durante um fluxo, eu preservo a rota de retorno para ele continuar de onde parou."

### Pontos importantes

- Sessao recuperavel apos refresh.
- Rotas privadas.
- Redirecionamento com contexto.
- Logout limpa cache privado.
- Troca de usuario limpa dados do usuario anterior.
- Senhas nao devem ser armazenadas em claro.

### Perguntas provaveis

- Como voce protegeu rotas?
- Como preservar o checkout apos login?
- O que acontece quando a sessao expira?
- Como evitar vazamento de dados entre usuarios?

## 10. Checkout, pagamento e pedidos

O checkout deve validar dados, selecionar carteira e rede, revisar a cotacao e criar pedido com idempotencia.

Idempotencia significa que repetir a mesma tentativa nao deve criar compras duplicadas. Isso e importante em cliques repetidos, timeout ou reconexao.

### Como explicar

"Antes de confirmar a compra, eu revalido preco, disponibilidade, cupom e taxas. A criacao de pedido usa uma chave de idempotencia, entao se houver timeout ou clique repetido, a mesma tentativa recupera o mesmo pedido em vez de criar outro."

### Pontos importantes

- Revisao antes de envio.
- Revalidacao antes da compra.
- Nova confirmacao se a cotacao mudou.
- Pedido pendente, confirmado ou recusado.
- Confirmacao so aparece para pedido confirmado.
- Recibo e snapshot.
- Alteracoes futuras no catalogo nao alteram recibo.

### Perguntas provaveis

- O que e idempotencia?
- Como voce evita pedido duplicado?
- Por que o recibo precisa ser snapshot?
- Como recuperar pedido depois de timeout?

## 11. Socket.IO e tempo real

Socket.IO sera usado para eventos em tempo real. O desafio exige pelo menos `nft.updated` e `order.updated`.

O app deve lidar com duplicatas, eventos antigos e reconexao.

### Como explicar

"Usei Socket.IO para receber atualizacoes em tempo real, como mudanca de preco/estoque e mudanca de status do pedido. Cada evento carrega versao, entao o cliente consegue ignorar eventos antigos ou duplicados."

### Pontos importantes

- `nft.updated` atualiza catalogo, detalhe e carrinho.
- `order.updated` atualiza estado do pedido.
- Eventos possuem identidade, recurso e versao.
- Reconexao dispara reconciliacao via REST.
- Eventos de usuario anterior nao podem afetar usuario atual.
- Listeners precisam ser limpos.

### Perguntas provaveis

- Como evitar aplicar evento antigo?
- O que acontece apos reconectar?
- Por que ainda consultar REST se existe socket?
- Como limpar subscriptions no logout?

## 12. Perfil e carteiras

Perfil e carteiras completam a area autenticada do colecionador. Esses dados tambem precisam persistir apos refresh e passar por validacao.

### Como explicar

"Perfil e carteiras seguem o mesmo padrao dos outros recursos: leitura via query, alteracao via mutation, validacao de formulario e invalidacao do cache apos sucesso."

### Pontos importantes

- Edicao de dados pessoais.
- Avatar.
- Alteracao de senha.
- Carteira principal e secundaria.
- Validacoes locais e erros da API.
- Persistencia.

### Perguntas provaveis

- Como voce validou formularios?
- Como mostrou erros retornados pela API?
- Como diferencia carteira principal e secundaria?
- Como garantir persistencia apos refresh?

## 13. Acessibilidade

Acessibilidade e requisito explicito do teste. Ela deve aparecer em formularios, navegacao, dialogs, drawers, feedbacks e estados de erro.

### Como explicar

"Eu tratei acessibilidade como parte da implementacao, nao como etapa decorativa. Campos tem labels, erros associados, foco visivel, navegacao por teclado e feedbacks acessiveis para acoes assicronas."

### Pontos importantes

- Navegacao por teclado.
- Foco visivel.
- Labels corretos.
- Mensagens de erro associadas.
- Texto alternativo.
- Contraste.
- Feedback nao depende apenas de cor.
- Dialogs/drawers controlam foco.
- Reduced motion.

### Perguntas provaveis

- Como testar acessibilidade?
- Como garantir foco em modal?
- Como informar erro para leitor de tela?
- Como tratar animacoes para usuarios sensiveis a movimento?

## 14. Testes e qualidade

Playwright sera usado para E2E e regressao visual. Lighthouse sera usado para auditar performance, acessibilidade e boas praticas.

### Como explicar

"Escolhi Playwright para cobrir os fluxos criticos de ponta a ponta: login, catalogo, carrinho, checkout, pedido e cenarios de erro. Como o MSW controla os cenarios, os testes conseguem reproduzir casos como sessao expirada, cupom invalido e timeout."

### Pontos importantes

- E2E dos fluxos principais.
- Testes de erro.
- Testes de responsividade.
- Regressao visual.
- Lighthouse.
- Cenarios deterministicos via MSW.

### Perguntas provaveis

- Quais fluxos voce priorizou nos testes?
- Como testar tempo real?
- Como testar timeout sem depender de instabilidade real?
- O que fazer se Lighthouse apontar problema?

## 15. Estrutura de pastas sugerida

```txt
src/
  app/
    router.tsx
    query-client.ts
    providers.tsx

  routes/
    __root.tsx
    index.tsx
    nft.$nftId.tsx
    cart.tsx
    checkout.tsx
    orders.$orderId.tsx
    login.tsx
    register.tsx
    profile.tsx
    wallets.tsx
    not-found.tsx

  features/
    auth/
    nfts/
    favorites/
    cart/
    checkout/
    orders/
    profile/
    wallets/
    realtime/

  shared/
    api/
    components/
    hooks/
    lib/
    types/

  mocks/
    handlers/
    fixtures/
    scenarios/
    socket/

  tests/
    e2e/
    visual/
```

### Como explicar

"Separei por dominios de produto em `features`, deixei infraestrutura compartilhada em `shared`, rotas em `routes` e backend simulado em `mocks`. Isso deixa o projeto facil de navegar sem criar uma arquitetura pesada demais para um teste tecnico."

## 16. Revisao final antes da entrega

Antes de entregar, revisar:

- [ ] Todas as telas obrigatorias existem.
- [ ] Fluxos principais funcionam.
- [ ] URL do catalogo preserva busca, filtros, ordenacao e pagina.
- [ ] Carrinho persiste e respeita disponibilidade.
- [ ] Checkout revalida cotacao.
- [ ] Pedido usa idempotencia.
- [ ] Sessao recupera apos refresh.
- [ ] Logout limpa dados privados.
- [ ] MSW cobre sucesso e falhas.
- [ ] Socket.IO atualiza NFT e pedido.
- [ ] Mobile, tablet e desktop foram testados.
- [ ] Acessibilidade basica foi conferida.
- [ ] Playwright roda.
- [ ] Lighthouse foi executado.
- [ ] README explica setup, mocks e decisoes.

