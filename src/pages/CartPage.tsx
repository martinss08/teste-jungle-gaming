import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { BenefitsSignup } from '../components/BenefitsSignup'
import { NftCarousel } from '../components/NftCarousel'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import type { CartItem, QuoteLine } from '../contracts/api'
import { formatEth } from '../lib/eth'
import { cn } from '../lib/utils'
import { listNfts } from '../modules/catalog/api'
import { useCart } from '../modules/cart/useCart'
import { useAuth } from '../modules/auth/useAuth'
import { AuthModalPage } from './LoginPage'
import { defaultCatalogSearch } from '../modules/catalog/search'

type AuthMode = 'login' | 'register'


type CartRow = {
  item: CartItem
  // Ausente enquanto a cotacao ainda nao refletiu a ultima alteracao do carrinho.
  quoteLine?: QuoteLine
}

function useCartRows(): CartRow[] {
  const { items, quote } = useCart()
  return items.map((item) => ({ item, quoteLine: quote?.lines.find((line) => line.nftId === item.nftId) }))
}

function useCouponForm() {
  const { applyCoupon } = useCart()
  const [coupon, setCoupon] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!coupon.trim()) return
    const result = await applyCoupon(coupon)
    if (result.ok) setCoupon('')
  }
  return { coupon, setCoupon, submit }
}

function describeIssues(line: QuoteLine) {
  const messages: string[] = []
  if (line.issues.includes('esgotado')) messages.push('Edicao esgotada.')
  if (line.issues.includes('disponibilidade-insuficiente')) messages.push(`Apenas ${line.available} disponiveis.`)
  if (line.issues.includes('preco-alterado') && line.previousUnitPriceEth) {
    messages.push(`Preco alterado de ${formatEth(line.previousUnitPriceEth)} para ${formatEth(line.unitPriceEth)}.`)
  }
  return messages
}

function canIncrease(row: CartRow) {
  return Boolean(row.quoteLine && row.item.quantity < row.quoteLine.available)
}

function AmountSkeleton({ className = 'h-4 w-24' }: { className?: string }) {
  return <Skeleton className={cn('inline-block align-middle', className)} />
}

// Resumo da cotacao oficial da API; mostra skeleton enquanto carrega e sinaliza recalculo.
function QuoteSummaryList({ className, rowClassName, totalClassName }: { className: string; rowClassName: string; totalClassName: string }) {
  const { subtotalEth, discountEth, networkFeeEth, totalEth, isQuoteLoading, isQuoteFetching } = useCart()
  const amount = (value: string, prefix = '') => (isQuoteLoading ? <AmountSkeleton /> : `${prefix}${formatEth(value)}`)

  return (
    <dl className={`${className} transition-opacity ${isQuoteFetching && !isQuoteLoading ? 'opacity-60' : ''}`} aria-busy={isQuoteFetching}>
      <div className={rowClassName}>
        <dt>Subtotal</dt>
        <dd>{amount(subtotalEth)}</dd>
      </div>
      <div className={rowClassName}>
        <dt>Desconto do lancamento</dt>
        <dd>{amount(discountEth, '(-) ')}</dd>
      </div>
      <div>
        <div className={rowClassName}>
          <dt>Taxa de rede</dt>
          <dd>{amount(networkFeeEth)}</dd>
        </div>
        <p className="text-right text-xs text-primarySoft">Taxa estimada</p>
      </div>
      <div className={totalClassName}>
        <dt>Total</dt>
        <dd className="text-primarySoft">{isQuoteLoading ? <AmountSkeleton className="h-6 w-28" /> : formatEth(totalEth)}</dd>
      </div>
    </dl>
  )
}

function CartChangesNotice() {
  const { quote, reviewChanges, isUpdating } = useCart()
  if (!quote?.stale) return null
  const affected = quote.lines.filter((line) => line.issues.length > 0)

  return (
    <div role="alert" className="rounded-sm border border-primary/60 bg-[#3a1d09] p-3 text-sm text-foreground">
      <p className="flex items-center gap-2 font-bold">
        <AlertTriangle size={16} className="text-primarySoft" />
        A cotacao do seu carrinho mudou.
      </p>
      {affected.length > 0 && (
        <ul className="mt-2 grid gap-1 text-xs text-[#d1b38f]">
          {affected.map((line) => (
            <li key={line.nftId}>{line.title}: {describeIssues(line).join(' ')}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="mt-3 text-xs font-bold text-primarySoft underline disabled:opacity-50"
        onClick={() => void reviewChanges()}
        disabled={isUpdating}
      >
        Aceitar valores atuais e ajustar quantidades
      </button>
    </div>
  )
}

function CouponFeedback() {
  const { couponCode, couponError, removeCoupon, isUpdating } = useCart()
  return (
    <>
      {couponCode && (
        <p className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-success">
          <span>Cupom {couponCode} aplicado.</span>
          <button type="button" className="text-primarySoft underline disabled:opacity-50" onClick={() => void removeCoupon()} disabled={isUpdating}>
            Remover cupom
          </button>
        </p>
      )}
      {couponError && <p role="alert" className="mt-2 text-xs font-bold text-red-200">{couponError}</p>}
    </>
  )
}

function CartNotice({ className }: { className: string }) {
  const { notice } = useCart()
  return <p role="status" aria-live="polite" className={className}>{notice}</p>
}

function useCanCheckout() {
  const { items, quote, isQuoteLoading, isQuoteFetching, isUpdating } = useCart()
  return items.length > 0 && !isQuoteLoading && !isQuoteFetching && !isUpdating && !quote?.stale
}

export function CartPage() {
  const { updateQuantity, removeItem, couponCode, isLoading, isUpdating, error } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const rows = useCartRows()
  const { coupon, setCoupon, submit: handleCouponSubmit } = useCouponForm()
  const canCheckout = useCanCheckout()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const recommendationsQuery = useQuery({
    queryKey: ['nfts', 'em-alta'],
    queryFn: ({ signal }) => listNfts({ tag: 'em-alta', pageSize: 20 }, signal),
  })
  const recommendations = (recommendationsQuery.data?.items ?? [])
    .filter((nft) => !rows.some((row) => row.item.nftId === nft.id))
    .slice(0, 15)
  const closeAuthModal = () => {
    setAuthOpen(false)
  }
  const handleCheckout = () => {
    if (isAuthenticated) {
      void navigate({ to: '/pagamento' })
      return
    }

    setAuthMode('login')
    setAuthOpen(true)
  }

  return (
    <>
      <MobileCartPage onCheckout={handleCheckout} />

      <div className="bg-[#120906] px-6 pb-12 font-mono text-foreground md:hidden">
        <NftCarousel title="Colecionadores tambem viram" items={recommendations} isLoading={recommendationsQuery.isPending} />
        <BenefitsSignup />
      </div>

      <div className="mx-auto hidden max-w-[1440px] px-4 pb-14 pt-9 sm:px-6 md:block lg:px-[60px] xl:px-[120px]">
      <div className="font-display text-base font-bold text-foreground">
        <Link to="/" search={defaultCatalogSearch} className="hover:text-primarySoft">Inicio</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <Link to="/" search={defaultCatalogSearch} hash="catalogo" className="hover:text-primarySoft">Mercado</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <span>Carrinho</span>
      </div>

      <section className="mt-3 grid gap-14 lg:grid-cols-[600px_250px] lg:gap-[60px] xl:grid-cols-[840px_330px] xl:gap-[86px]">
        <div>
          <div className="hidden border-b border-border pb-3 font-display text-base font-bold sm:grid sm:grid-cols-[230px_95px_130px_115px_30px_24px] xl:grid-cols-[320px_140px_150px_130px_40px_60px]">
            <span>NFTs</span>
            <span>Preco</span>
            <span>Edicoes</span>
            <span>Total</span>
            <span />
            <span />
          </div>

          <div className={cn('mt-3 space-y-3 pr-1', rows.length > 5 && 'cart-scroll max-h-[527px] overflow-y-auto')}>
            {error && <p role="alert" className="rounded-sm border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-100">{error}</p>}
            <CartNotice className="min-h-5 text-sm font-bold text-success" />
            <CartChangesNotice />
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[96px] rounded-none" />
              ))
            ) : rows.length ? (
              rows.map((row) => {
                const { item, quoteLine } = row
                if (!quoteLine) return <Skeleton key={item.nftId} className="h-[96px] rounded-none" />
                const issues = describeIssues(quoteLine)

                return (
                  <div
                    key={item.nftId}
                    className="grid gap-4 bg-card p-2 font-display font-bold sm:grid-cols-[230px_95px_130px_115px_30px_24px] sm:items-center sm:gap-0 xl:grid-cols-[320px_140px_150px_130px_40px_60px] xl:p-3"
                  >
                    <div className="grid grid-cols-[56px_1fr] items-center gap-3 xl:grid-cols-[70px_1fr] xl:gap-4">
                      <div className="size-14 overflow-hidden rounded-md bg-[#efe7d2] xl:size-[70px]">
                        <img src={quoteLine.imageUrl} alt={quoteLine.title} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <h2 className="text-lg text-foreground">{quoteLine.title}</h2>
                        <p className="mt-1 text-sm text-[#b29274]">Edicao: {quoteLine.edition}</p>
                        {issues.length > 0 && <p className="mt-1 text-xs text-red-200">{issues.join(' ')}</p>}
                      </div>
                    </div>

                    <p className="text-sm text-[#ccb59d] xl:text-base">
                      {quoteLine.previousUnitPriceEth && (
                        <span className="block text-xs text-[#8f7560] line-through">{formatEth(quoteLine.previousUnitPriceEth)}</span>
                      )}
                      {formatEth(quoteLine.unitPriceEth)}
                    </p>

                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-full bg-primary text-[#160b08] disabled:opacity-40"
                        onClick={() => void updateQuantity(item.nftId, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isUpdating}
                        aria-label={`Diminuir quantidade de ${quoteLine.title}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-5 text-center text-lg">{item.quantity}</span>
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-full bg-primary text-[#160b08] disabled:opacity-40"
                        onClick={() => void updateQuantity(item.nftId, item.quantity + 1)}
                        disabled={!canIncrease(row) || isUpdating}
                        aria-label={`Aumentar quantidade de ${quoteLine.title}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="text-sm text-primarySoft xl:text-lg">{formatEth(quoteLine.subtotalEth)}</p>

                    <button
                      type="button"
                      className="justify-self-start text-[#b29274] transition hover:text-primarySoft disabled:opacity-40"
                      onClick={() => void removeItem(item.nftId)}
                      disabled={isUpdating}
                      aria-label={`Remover ${quoteLine.title}`}
                    >
                      <Trash2 size={22} />
                    </button>
                    <span aria-hidden="true" />
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
          <form className="mt-6" onSubmit={handleCouponSubmit}>
            <label htmlFor="coupon" className="font-display text-sm font-bold">Codigo promocional</label>
            <div className="mt-2 flex overflow-hidden rounded-sm border border-primary bg-[#3a1d09]">
              <input id="coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 text-xs text-foreground outline-none" placeholder={couponCode ?? 'Digite o codigo promocional...'} />
              <Button type="submit" className="rounded-none px-4" disabled={isUpdating || !coupon.trim()}>Aplicar</Button>
            </div>
            <CouponFeedback />
          </form>

          <QuoteSummaryList
            className="mt-6 grid gap-4 font-display text-sm"
            rowClassName="flex justify-between"
            totalClassName="flex justify-between pt-3 text-lg font-bold"
          />

          {canCheckout ? (
            <Button type="button" className="mt-5 w-full" size="lg" onClick={handleCheckout}>Conectar e finalizar</Button>
          ) : (
            <Button className="mt-5 w-full" size="lg" disabled>Conectar e finalizar</Button>
          )}
          <Link to="/" search={defaultCatalogSearch} className="mt-4 block text-center font-display text-base text-primarySoft hover:text-primary">
            Continuar explorando
          </Link>
        </aside>
      </section>

      <NftCarousel title="Colecionadores tambem viram" items={recommendations} isLoading={recommendationsQuery.isPending} />

      <BenefitsSignup />
      </div>
      {authOpen && (
        <AuthModalPage
          mode={authMode}
          redirect="/pagamento"
          onClose={closeAuthModal}
          onModeChange={setAuthMode}
          onSuccess={() => {
            setAuthOpen(false)
            void navigate({ to: '/pagamento' })
          }}
        />
      )}
    </>
  )
}

function MobileCartPage({ onCheckout }: { onCheckout: () => void }) {
  const { updateQuantity, removeItem, couponCode, isLoading, isUpdating, error } = useCart()
  const rows = useCartRows()
  const { coupon, setCoupon, submit: handleCouponSubmit } = useCouponForm()
  const canCheckout = useCanCheckout()

  return (
    <div className="min-h-screen bg-[#120906] px-6 pb-8 pt-8 font-mono text-foreground md:hidden">
      <header className="grid grid-cols-[44px_1fr_44px] items-center">
        <Link to="/" search={defaultCatalogSearch} className="grid size-9 place-items-center rounded-full border border-border bg-card text-primarySoft" aria-label="Voltar">
          <ArrowLeft size={19} />
        </Link>
        <h1 className="text-center text-xl font-black tracking-[0.05em]">Carrinho de NFTs</h1>
      </header>

      <div className={cn('mt-5 grid gap-5 pr-1', rows.length > 5 && 'cart-scroll max-h-[600px] overflow-y-auto')}>
        {error && <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-100">{error}</p>}
        <CartNotice className="min-h-5 text-xs font-bold text-success" />
        <CartChangesNotice />
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[100px] rounded-xl" />
          ))
        ) : rows.length ? rows.map((row) => {
          const { item, quoteLine } = row
          if (!quoteLine) return <Skeleton key={item.nftId} className="h-[100px] rounded-xl" />
          const issues = describeIssues(quoteLine)

          return (
            <article key={item.nftId} className="grid grid-cols-[100px_1fr_auto] items-center rounded-xl bg-card pr-4">
              <img src={quoteLine.imageUrl} alt={quoteLine.title} className="size-[100px] rounded-l-xl object-cover" />
              <div className="min-w-0 px-3">
                <h2 className="truncate text-sm font-black">{quoteLine.title}</h2>
                <p className="mt-1 text-xs text-[#caa677]">Edicao: {quoteLine.edition}</p>
                {issues.length > 0 && <p className="mt-1 text-[11px] text-red-200">{issues.join(' ')}</p>}
                <p className="mt-2 text-lg font-black text-primarySoft">{formatEth(quoteLine.subtotalEth)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <button type="button" className="grid size-6 place-items-center rounded-full border border-border bg-[#3a2118] text-primarySoft disabled:opacity-40" onClick={() => void updateQuantity(item.nftId, item.quantity - 1)} disabled={item.quantity <= 1 || isUpdating} aria-label={`Diminuir quantidade de ${quoteLine.title}`}>
                    <Minus size={13} />
                  </button>
                  <span className="w-3 text-center text-base">{item.quantity}</span>
                  <button type="button" className="grid size-6 place-items-center rounded-full border border-border bg-[#3a2118] text-primarySoft disabled:opacity-40" onClick={() => void updateQuantity(item.nftId, item.quantity + 1)} disabled={!canIncrease(row) || isUpdating} aria-label={`Aumentar quantidade de ${quoteLine.title}`}>
                    <Plus size={13} />
                  </button>
                </div>
                <button type="button" className="text-[#b29274] disabled:opacity-40" onClick={() => void removeItem(item.nftId)} disabled={isUpdating} aria-label={`Remover ${quoteLine.title}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          )
        }) : (
          <div className="rounded-xl bg-card p-6 text-center text-sm text-[#caa677]">Seu carrinho esta vazio.</div>
        )}
      </div>

      <section className="-mx-6 mt-2 rounded-t-[32px] bg-card px-6 pb-8 pt-6">
        <form className="flex rounded-[28px] border border-border bg-[#2a1710] p-1" onSubmit={handleCouponSubmit}>
          <label htmlFor="coupon-mobile" className="sr-only">Codigo promocional</label>
          <input id="coupon-mobile" value={coupon} onChange={(event) => setCoupon(event.target.value)} className="min-w-0 flex-1 bg-transparent px-4 text-xs tracking-[0.07em] text-foreground outline-none placeholder:text-[#caa677]" placeholder={couponCode ?? 'Digite o codigo promocional...'} />
          <button type="submit" className="h-12 rounded-[24px] bg-[#c57d3b] px-6 text-sm font-black disabled:opacity-50" disabled={isUpdating || !coupon.trim()}>Aplicar</button>
        </form>
        <CouponFeedback />

        <QuoteSummaryList
          className="mt-4 grid gap-3 text-sm"
          rowClassName="flex justify-between"
          totalClassName="flex justify-between pt-1 text-lg font-black"
        />

        {canCheckout ? (
          <button type="button" className="mt-8 block h-[60px] w-full rounded-[30px] bg-primary text-center text-sm font-black leading-[60px] text-[#120906]" onClick={onCheckout}>
            Conectar e finalizar
          </button>
        ) : (
          <button type="button" className="mt-8 h-[60px] w-full rounded-[30px] bg-primary text-sm font-black text-[#120906] opacity-50" disabled>
            Conectar e finalizar
          </button>
        )}
      </section>
    </div>
  )
}
