import { Link } from '@tanstack/react-router'
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { nfts } from '../data/nfts'
import { formatEth } from '../lib/utils'
import type { CartLine, Nft } from '../types'
import { useCart } from '../modules/cart/useCart'

const homeSearch = { q: '', rarity: 'todos', sort: 'recentes', page: 1 }

function BenefitsSignup() {
  return (
    <section className="mt-24 bg-card">
      <div className="grid gap-0 md:grid-cols-4">
        {[
          ['W', 'Seguranca da carteira', 'Proteja sua carteira e colecione arte digital verificada com confianca.'],
          ['C', 'Criadores em destaque', 'Conheca artistas, estudios e comunidades que moldam a cultura digital na rede.'],
          ['D', 'Alertas de lancamentos', 'Receba calendarios de cunhagem, novidades de listas de acesso e analises do mercado.'],
        ].map(([letter, title, text]) => (
          <div key={title} className="border-b border-border p-8 md:border-b-0 md:border-r">
            <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-xl font-bold text-[#160b08]">{letter}</span>
            <h3 className="mt-5 font-display text-base font-bold">{title}</h3>
            <p className="mt-3 text-sm font-bold leading-6 text-[#9b826d]">{text}</p>
          </div>
        ))}
        <div className="p-8">
          <h3 className="font-display text-base font-bold">Antecipe-se ao proximo lancamento</h3>
          <div className="mt-5 flex overflow-hidden rounded-sm border border-border bg-[#160b08]">
            <input className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground outline-none" placeholder="Digite seu e-mail..." />
            <Button className="rounded-none">Enviar</Button>
          </div>
          <p className="mt-4 text-xs font-bold leading-5 text-[#9b826d]">Receba lancamentos selecionados, historias de criadores e novidades do mercado.</p>
        </div>
      </div>
    </section>
  )
}

function RecommendationCard({ nft, index }: { nft: Nft; index: number }) {
  const names = ['Cosmic Bloom', 'Violet Nomad', 'Ivory Baron', 'Golden Beat', 'Golden Signal']
  const codes = ['118', '314', '088', '207', '160']
  const displayIndex = index % names.length

  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group block">
      <div className="bg-card p-5">
        <div className="aspect-square overflow-hidden rounded-md bg-[#efe7d2]">
          <img src={nft.hero} alt={nft.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
        </div>
      </div>
      <h3 className="mt-3 truncate font-display text-base font-bold text-[#d3c2b3]">
        {names[displayIndex]} #{codes[displayIndex]}
      </h3>
      <p className="font-display text-lg font-bold text-primarySoft">
        {formatEth((Number(nft.priceEth) * (0.72 + displayIndex * 0.05)).toFixed(2))}
      </p>
    </Link>
  )
}

function buildDisplayLines(items: CartLine[]): CartLine[] {
  const fallbacks: CartLine[] = [
    { nftId: 'emerald-ape-042', quantity: 2 },
    { nftId: 'sage-hood-804', quantity: 6 },
    { nftId: 'onyx-visual-232', quantity: 9 },
  ]
  if (!items.length) return fallbacks

  const ids = new Set(items.map((item) => item.nftId))
  return [...items, ...fallbacks.filter((item) => !ids.has(item.nftId))].slice(0, 3)
}

export function CartPage() {
  const { items, updateQuantity, removeItem, subtotalEth, discountEth, networkFeeEth, totalEth } = useCart()
  const [recommendationPage, setRecommendationPage] = useState(0)
  const displayLines = buildDisplayLines(items)
  const displayPrices = [1.19, 1.39, 1.79]
  const recommendationPool = nfts.length > 1 ? nfts : nfts
  const recommendationPages = Array.from({ length: 3 }, (_, pageIndex) =>
    Array.from({ length: 5 }, (_, itemIndex) => recommendationPool[(pageIndex * 5 + itemIndex + 1) % recommendationPool.length]),
  )
  const recommendations = recommendationPages[recommendationPage]
  const summarySubtotal = displayLines.reduce((total, line, index) => total + displayPrices[index] * line.quantity, 0)
  const summaryNetworkFee = displayLines.length ? 0.016 : 0
  const summaryDiscount = discountEth || 0
  const summaryTotal = summarySubtotal - summaryDiscount + summaryNetworkFee

  return (
    <>
      <MobileCartPage />

      <div className="mx-auto hidden max-w-[1440px] px-4 pb-14 pt-9 sm:px-6 md:block lg:px-[60px] xl:px-[120px]">
      <div className="font-display text-base font-bold text-foreground">
        <Link to="/" search={homeSearch} className="hover:text-primarySoft">Inicio</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <Link to="/" search={homeSearch} hash="catalogo" className="hover:text-primarySoft">Mercado</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <span>Carrinho</span>
      </div>

      <section className="mt-3 grid gap-14 lg:grid-cols-[600px_250px] lg:gap-[60px] xl:grid-cols-[780px_330px] xl:gap-[86px]">
        <div>
          <div className="hidden border-b border-border pb-3 font-display text-base font-bold sm:grid sm:grid-cols-[230px_95px_130px_115px_30px] xl:grid-cols-[320px_140px_150px_130px_40px]">
            <span>NFTs</span>
            <span>Preco</span>
            <span>Edicoes</span>
            <span>Total</span>
            <span />
          </div>

          <div className="mt-3 space-y-3">
            {displayLines.length ? (
              displayLines.map((line, index) => {
                const nft = nfts.find((item) => item.id === line.nftId)
                if (!nft) return null
                const isRealCartItem = items.some((item) => item.nftId === line.nftId)
                const title = index === 1 ? 'Violet Nomad #314' : index === 2 ? 'Ivory Baron #088' : nft.title
                const token = index === 0 ? '#0042' : index === 1 ? '#0009' : '#0552'
                const displayPrice = displayPrices[index] ?? Number(nft.priceEth)
                const lineTotal = displayPrice * line.quantity

                return (
                  <div
                    key={`${line.nftId}-${index}`}
                    className="grid gap-4 bg-card p-2 font-display font-bold sm:grid-cols-[230px_95px_130px_115px_30px] sm:items-center sm:gap-0 xl:grid-cols-[320px_140px_150px_130px_40px] xl:p-3"
                  >
                    <div className="grid grid-cols-[56px_1fr] items-center gap-3 xl:grid-cols-[70px_1fr] xl:gap-4">
                      <div className="size-14 overflow-hidden rounded-md bg-[#efe7d2] xl:size-[70px]">
                        <img src={nft.hero} alt={title} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <h2 className="text-lg text-foreground">{title}</h2>
                        <p className="mt-1 text-sm text-[#b29274]">ID do token: {token}</p>
                      </div>
                    </div>

                    <p className="text-sm text-[#ccb59d] xl:text-base">{formatEth(displayPrice)}</p>

                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-full bg-primary text-[#160b08]"
                        onClick={() => isRealCartItem && updateQuantity(line.nftId, line.quantity - 1)}
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-5 text-center text-lg">{line.quantity}</span>
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-full bg-primary text-[#160b08]"
                        onClick={() => isRealCartItem && updateQuantity(line.nftId, line.quantity + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="text-sm text-primarySoft xl:text-lg">{formatEth(lineTotal)}</p>

                    <button
                      type="button"
                      className="text-[#b29274] transition hover:text-primarySoft"
                      onClick={() => isRealCartItem && removeItem(line.nftId)}
                      aria-label={`Remover ${title}`}
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="bg-card p-8 text-center">
                <h2 className="font-display text-2xl font-bold">Seu carrinho esta vazio</h2>
                <p className="mt-2 text-[#9b826d]">Adicione NFTs do catalogo para iniciar uma compra.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="self-start">
          <h2 className="border-b border-border pb-3 font-display text-lg font-bold">Resumo da carteira</h2>
          <div className="mt-6">
            <label htmlFor="coupon" className="font-display text-sm font-bold">Codigo promocional</label>
            <div className="mt-2 flex overflow-hidden rounded-sm border border-primary bg-[#3a1d09]">
              <input id="coupon" className="min-w-0 flex-1 bg-transparent px-3 text-xs text-foreground outline-none" placeholder="Digite o codigo promocional..." />
              <Button className="rounded-none px-4">Aplicar</Button>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 font-display text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{(summarySubtotal || subtotalEth).toFixed(2)} ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>Desconto do lancamento</dt>
              <dd>(-) {summaryDiscount.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd>{(summaryNetworkFee || networkFeeEth).toFixed(3)} ETH</dd>
            </div>
            <p className="-mt-2 text-right text-xs text-primarySoft">Taxa estimada</p>
            <div className="flex justify-between pt-3 text-lg font-bold">
              <dt>Total</dt>
              <dd className="text-primarySoft">{(summaryTotal || totalEth).toFixed(3)} ETH</dd>
            </div>
          </dl>

          <Link to="/pagamento" className="mt-5 block">
            <Button className="w-full" size="lg" disabled={!displayLines.length}>
              Conectar e finalizar
            </Button>
          </Link>
          <Link to="/" search={homeSearch} className="mt-4 block text-center font-display text-base text-primarySoft hover:text-primary">
            Continuar explorando
          </Link>
        </aside>
      </section>

      <section className="mt-24">
        <h2 className="border-b border-border pb-3 font-display text-xl font-bold text-primarySoft">Colecionadores tambem viram</h2>
        <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-5">
          {recommendations.map((item, index) => (
            <RecommendationCard key={`${recommendationPage}-${item.id}-${index}`} nft={item} index={recommendationPage * 5 + index} />
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {recommendationPages.map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              className={
                pageIndex === recommendationPage
                  ? 'size-3 rounded-full border border-primary bg-primary'
                  : 'size-3 rounded-full border border-primary bg-primary/20 transition hover:bg-primary/50'
              }
              aria-label={`Mostrar recomendacoes ${pageIndex + 1}`}
              aria-current={pageIndex === recommendationPage ? 'true' : undefined}
              onClick={() => setRecommendationPage(pageIndex)}
            />
          ))}
        </div>
      </section>

      <BenefitsSignup />
      </div>
    </>
  )
}

function MobileCartPage() {
  const { items, updateQuantity, removeItem } = useCart()
  const lines = buildDisplayLines(items)
  const mobileLines = [...lines, { nftId: 'golden-bark-907', quantity: 2 }].slice(0, 4)
  const names = ['Emerald Ape #042', 'Violet Nomad #314', 'Ivory Baron #088', 'Golden Beat #207']
  const editions = ['1/50', '1/1', '1/10', '1/50']
  const prices = [1.19, 1.39, 3.58, 1.98]
  const displayQuantities = [1, 1, 2, 2]
  const subtotal = 8.92
  const networkFee = 0.016
  const total = subtotal + networkFee

  return (
    <div className="min-h-screen bg-[#120906] px-6 pb-8 pt-8 font-mono text-foreground md:hidden">
      <header className="grid grid-cols-[44px_1fr_44px] items-center">
        <Link to="/" search={homeSearch} className="grid size-9 place-items-center rounded-full border border-border bg-card text-primarySoft" aria-label="Voltar">
          <ArrowLeft size={19} />
        </Link>
        <h1 className="text-center text-xl font-black tracking-[0.05em]">Carrinho de NFTs</h1>
      </header>

      <div className="mt-5 grid gap-5">
        {mobileLines.map((line, index) => {
          const nft = nfts.find((item) => item.id === line.nftId) ?? nfts[index]
          const isRealCartItem = items.some((item) => item.nftId === line.nftId)

          return (
            <article key={`${line.nftId}-${index}`} className="grid grid-cols-[100px_1fr_auto] items-center rounded-xl bg-card pr-4">
              <img src={nft.hero} alt={names[index]} className="size-[100px] rounded-l-xl object-cover" />
              <div className="min-w-0 px-3">
                <h2 className="truncate text-sm font-black">{names[index]}</h2>
                <p className="mt-1 text-xs text-[#caa677]">Edicao: {editions[index]}</p>
                <p className="mt-3 text-lg font-black text-primarySoft">{prices[index].toFixed(2)} ETH</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="grid size-6 place-items-center rounded-full border border-border bg-[#3a2118] text-primarySoft" onClick={() => isRealCartItem && updateQuantity(line.nftId, displayQuantities[index] - 1)} aria-label="Diminuir quantidade">
                  <Minus size={13} />
                </button>
                <span className="w-3 text-center text-base">{displayQuantities[index]}</span>
                <button type="button" className="grid size-6 place-items-center rounded-full border border-border bg-[#3a2118] text-primarySoft" onClick={() => (isRealCartItem ? updateQuantity(line.nftId, displayQuantities[index] + 1) : undefined)} aria-label="Aumentar quantidade">
                  <Plus size={13} />
                </button>
                {isRealCartItem && (
                  <button type="button" className="sr-only" onClick={() => removeItem(line.nftId)}>
                    Remover
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <section className="-mx-6 mt-2 rounded-t-[32px] bg-card px-6 pb-8 pt-6">
        <div className="flex rounded-[28px] border border-border bg-[#2a1710] p-1">
          <input className="min-w-0 flex-1 bg-transparent px-4 text-xs tracking-[0.07em] text-foreground outline-none placeholder:text-[#caa677]" placeholder="Digite o codigo promocional..." />
          <button type="button" className="h-12 rounded-[24px] bg-[#c57d3b] px-6 text-sm font-black">Aplicar</button>
        </div>

        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{subtotal.toFixed(2)} ETH</dd>
          </div>
          <div className="flex justify-between">
            <dt>Desconto do lancamento</dt>
            <dd>(-) 00.00</dd>
          </div>
          <div>
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd>{networkFee.toFixed(3)} ETH</dd>
            </div>
            <p className="text-right text-xs text-primarySoft">Taxa estimada</p>
          </div>
          <div className="flex justify-between pt-1 text-lg font-black">
            <dt>Total</dt>
            <dd className="text-primarySoft">{total.toFixed(3)} ETH</dd>
          </div>
        </dl>

        <Link to="/pagamento" className="mt-8 block">
          <button type="button" className="h-[60px] w-full rounded-[30px] bg-primary text-sm font-black text-[#120906]">
            Conectar e finalizar
          </button>
        </Link>
      </section>
    </div>
  )
}
