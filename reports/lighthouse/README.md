# Lighthouse

Auditoria executada em 19/09/2026 com:

- Comando: `npm run lighthouse`
- Build: `VITE_ENABLE_MSW=true npm run build`
- Servidor: `vite preview` em `http://127.0.0.1:4173`
- Lighthouse: 13.4.1
- Browser: HeadlessChrome 149
- Medicoes: 3 por pagina/perfil

## Medianas

| Alvo | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Inicio mobile | 84 | 96 | 96 | 92 | 3668.83 ms | 0.0747 | 46 ms |
| Inicio desktop | 96 | 97 | 96 | 92 | 1230.18 ms | 0.0028 | 0 ms |
| Detalhe mobile | 81 | 89 | 96 | 92 | 3634.83 ms | 0.1300 | 40 ms |
| Detalhe desktop | 88 | 87 | 96 | 92 | 996.16 ms | 0.2094 | 0 ms |

## Metas do desafio

- Performance: >= 90
- Accessibility: >= 95
- Best Practices: >= 95
- SEO: >= 90

## Resultados abaixo da meta

- Performance mobile ficou abaixo da meta na home e no detalhe. A causa principal e o peso das imagens locais, especialmente `kurio-ape-emerald-detail` e os PNGs de cards, somado ao bundle de mock/MSW habilitado na build de demonstracao.
- Performance desktop do detalhe ficou em 88, tambem impactada pela imagem principal grande e pelo CLS do detalhe.
- Accessibility do detalhe ficou abaixo da meta. O relatorio JSON/HTML deve ser usado para corrigir os apontamentos especificos antes da entrega final se houver tempo; os fluxos E2E ja cobrem labels, foco e validacoes principais, mas Lighthouse ainda sinaliza pontos de pagina.
- CLS do detalhe e o ponto visual mais claro a melhorar. Reservar dimensoes mais rigidas para a midia principal e conteudos carregados tende a subir Performance e Accessibility percebida.

## Arquivos

- `summary.json`: resumo das medianas e ambiente.
- `*.report.html`: relatorios navegaveis.
- `*.report.json`: saida bruta usada para calcular as medianas.
