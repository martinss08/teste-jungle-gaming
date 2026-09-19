import { Link } from '@tanstack/react-router'
import { BadgeCheck, ChevronDown, Download, Heart, ShoppingCart, Tag, UserRound, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { defaultCatalogSearch } from '../modules/catalog/search'

const steps = [
  {
    icon: ShoppingCart,
    title: 'Escolha um NFT',
    text: 'Use o mercado para comparar preco, rede, edicao e disponibilidade antes de adicionar ao carrinho.',
  },
  {
    icon: Tag,
    title: 'Aplique um cupom',
    text: 'No resumo da carteira, digite o codigo promocional e confira o desconto recalculado.',
  },
  {
    icon: WalletCards,
    title: 'Conecte a carteira',
    text: 'Selecione a carteira principal ou secundaria cadastrada e confirme a conexao simulada.',
  },
  {
    icon: BadgeCheck,
    title: 'Finalize a compra',
    text: 'Depois da confirmacao, seus NFTs aparecem em Minha colecao no perfil.',
  },
]

const faq = [
  [
    'Onde vejo meus NFTs comprados?',
    'Depois que o pagamento e confirmado, os NFTs aparecem automaticamente em Meu perfil > Minha colecao. Essa area funciona como sua vitrine pessoal: ela mostra os itens que voce possui, a edicao comprada, a quantidade, a carteira usada e a data da compra. Se uma compra acabou de ser finalizada, recarregar a pagina ou acessar pelo botao Ver minha colecao no modal de confirmacao leva voce direto para essa lista.',
  ],
  [
    'Onde baixo os arquivos?',
    'Os arquivos ficam em Meu perfil > Arquivos baixados. Para cada NFT comprado, a Kurio disponibiliza materiais digitais relacionados, como a imagem do NFT, certificado de propriedade e metadados em JSON. Essa area e diferente da colecao: a colecao mostra o que voce possui; arquivos baixados mostra os materiais que voce pode salvar no seu dispositivo.',
  ],
  [
    'Favorito e compra sao a mesma coisa?',
    'Nao. Favoritar e apenas uma forma de guardar interesse em um NFT para olhar depois. Esses itens aparecem em Meu perfil > Lista de interesse. A compra so acontece quando o NFT e adicionado ao carrinho, o pagamento e revisado e a carteira confirma a transacao. Depois disso, o item passa a aparecer em Minha colecao.',
  ],
  [
    'Posso comprar sem carteira?',
    'Nao. A carteira e necessaria para receber o NFT comprado e registrar a transacao simulada. Todo usuario ja tem uma carteira principal por padrao, mas voce pode revisar os dados em Meu perfil > Carteiras e adicionar uma carteira secundaria se quiser usar outro endereco no pagamento.',
  ],
  [
    'Como funcionam os cupons?',
    'Os cupons sao codigos promocionais digitados no Resumo da carteira, dentro do carrinho. Quando o codigo e valido, o desconto aparece na cotacao antes de finalizar a compra. Voce tambem pode consultar os cupons disponiveis em Meu perfil > Cupons, mas a aplicacao do desconto acontece no carrinho.',
  ],
]

const shortcuts = [
  {
    icon: ShoppingCart,
    title: 'Explorar mercado',
    text: 'Compare NFTs por colecao, preco e rede.',
    to: '/',
    hash: 'catalogo',
  },
  {
    icon: Heart,
    title: 'Lista de interesse',
    text: 'Veja os NFTs favoritados para comprar depois.',
    to: '/perfil',
    hash: 'favoritos',
  },
  {
    icon: WalletCards,
    title: 'Carteiras',
    text: 'Revise a carteira principal antes do checkout.',
    to: '/perfil',
    hash: 'carteiras',
  },
  {
    icon: Download,
    title: 'Arquivos baixados',
    text: 'Baixe imagem, certificado e metadados.',
    to: '/perfil',
    hash: 'arquivos',
  },
  {
    icon: UserRound,
    title: 'Suporte',
    text: 'Abra um chamado se travar em alguma etapa.',
    to: '/perfil',
    hash: 'suporte',
  },
] as const

export function LearnPage() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-8 font-mono sm:px-6 lg:px-[120px]">
      <section className="border-b border-border pb-10">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Aprenda</span>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Como comprar NFTs na Kurio</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#caa677]">
          Um guia rapido para entender carrinho, cupons, carteira, colecao e arquivos digitais depois da compra.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Passos de compra">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <article key={title} className="bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-md bg-primary/15 text-primarySoft">
                <Icon size={20} />
              </span>
              <span className="font-display text-sm font-bold text-primarySoft">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h2 className="mt-5 font-display text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/60">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-card p-6">
          <h2 className="font-display text-xl font-bold">Perguntas frequentes</h2>
          <div className="mt-5 divide-y divide-border">
            {faq.map(([question, answer], index) => {
              const isOpen = openFaq === index
              return (
                <article key={question} className="py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left font-display text-base font-bold"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                  <span>{question}</span>
                    <ChevronDown size={18} className={`shrink-0 text-primarySoft transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <p id={`faq-answer-${index}`} className="mt-3 text-sm leading-7 text-foreground/60">{answer}</p>}
                </article>
              )
            })}
          </div>
        </div>

        <aside className="bg-[#3a1d09] p-6">
          <h2 className="font-display text-xl font-bold">Atalhos uteis</h2>
          <p className="mt-2 text-sm leading-6 text-[#caa677]">Continue a partir do ponto certo do fluxo de compra.</p>
          <div className="mt-5 grid gap-3">
            {shortcuts.map(({ icon: Icon, title, text, to, hash }) => (
              <Link
                key={title}
                to={to}
                search={to === '/' ? defaultCatalogSearch : undefined}
                hash={hash}
                className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border border-primary/25 bg-[#170d0a]/60 p-3 transition hover:border-primary hover:bg-[#170d0a]"
              >
                <span className="grid size-9 place-items-center rounded-sm bg-primary/15 text-primarySoft">
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold text-primarySoft">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-foreground/55">{text}</span>
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
