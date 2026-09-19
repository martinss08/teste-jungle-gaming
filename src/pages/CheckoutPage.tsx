import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, CheckCircle2, Link2, Unlink, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { SUPPORTED_NETWORKS, type QuoteResponse } from '../contracts/api'
import { formatEth } from '../lib/eth'
import { cn } from '../lib/utils'
import { useCart } from '../modules/cart/useCart'
import { type CheckoutFlow, type CollectorForm, useCheckoutFlow, walletProviders } from '../modules/checkout/useCheckoutFlow'
import { defaultCatalogSearch } from '../modules/catalog/search'


const inputClass =
  'h-10 w-full min-w-0 max-w-full rounded-sm border border-border bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-[#a98461] focus:border-primary aria-[invalid=true]:border-red-400'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} className="mt-1 text-xs font-bold text-red-200">{message}</p>
}

function TextField({
  flow,
  field,
  label,
  type = 'text',
  autoComplete,
}: {
  flow: CheckoutFlow
  field: Exclude<keyof CollectorForm, 'note'>
  label: string
  type?: string
  autoComplete?: string
}) {
  const id = `checkout-${field}`
  const error = flow.errors[field]
  return (
    <div className="min-w-0 font-mono text-sm tracking-[0.03em]">
      <label htmlFor={id}>
        {label}
        <span className="text-primary"> *</span>
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={flow.values[field]}
        onChange={(event) => flow.setField(field, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(inputClass, 'mt-2')}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function DisplayField({
  id,
  label,
  value,
  placeholder,
  unavailable = false,
}: {
  id: string
  label: string
  value?: string
  placeholder?: string
  unavailable?: boolean
}) {
  return (
    <div className="min-w-0 font-mono text-sm tracking-[0.03em]">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value ?? ''}
        placeholder={placeholder}
        readOnly
        disabled={unavailable}
        aria-describedby={unavailable ? 'checkout-unavailable-note' : undefined}
        className={cn(inputClass, 'mt-2 text-[#b9966d] disabled:cursor-not-allowed disabled:opacity-50')}
      />
    </div>
  )
}

function Notice({ tone = 'warning', children }: { tone?: 'warning' | 'error'; children: ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-2 rounded-sm border p-3 text-sm',
        tone === 'error' ? 'border-red-900/50 bg-red-950/30 text-red-100' : 'border-primary/60 bg-[#3a1d09] text-foreground',
      )}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-primarySoft" />
      <div>{children}</div>
    </div>
  )
}

function CollectorSection({ flow }: { flow: CheckoutFlow }) {
  const noteError = flow.errors.note
  const primaryWallet = flow.wallets.find((wallet) => wallet.kind === 'principal')
  const secondaryWallet = flow.wallets.find((wallet) => wallet.kind === 'secundaria')
  const usingSecondary = Boolean(secondaryWallet && flow.selectedWallet?.id === secondaryWallet.id)
  return (
    <section aria-labelledby="collector-title">
      <h2 id="collector-title" className="font-display text-lg font-bold">Perfil do colecionador</h2>
      <div className="mt-4 grid gap-x-5 gap-y-4 md:grid-cols-2">
        <TextField flow={flow} field="displayName" label="Nome de exibicao" autoComplete="name" />
        <TextField flow={flow} field="username" label="Nome de usuario" autoComplete="username" />
        <div className="min-w-0 font-mono text-sm tracking-[0.03em]">
          <label htmlFor="checkout-network">
            Rede<span className="text-primary"> *</span>
          </label>
          <select
            id="checkout-network"
            value={flow.network}
            onChange={(event) => flow.setNetwork(event.target.value)}
            aria-invalid={Boolean(flow.errors.network)}
            aria-describedby={flow.errors.network ? 'checkout-network-error' : undefined}
            className={cn(inputClass, 'mt-2 bg-[#120906] text-[#b9966d]')}
          >
            {SUPPORTED_NETWORKS.map((network) => (
              <option key={network} value={network}>{network}</option>
            ))}
          </select>
          <FieldError id="checkout-network-error" message={flow.errors.network} />
        </div>
        <DisplayField id="checkout-profile-name" label="Nome do perfil" value={flow.values.username} />
        <DisplayField id="checkout-wallet-address" label="Endereco da carteira" value={flow.selectedWallet?.address} placeholder="Endereco 0x da carteira" />
        <DisplayField
          id="checkout-secondary-wallet"
          label="Carteira secundaria (opcional)"
          value={secondaryWallet ? `${secondaryWallet.label} · ${secondaryWallet.address}` : ''}
          placeholder="Nenhuma carteira secundaria cadastrada"
        />
        <div className="min-w-0 font-mono text-xs tracking-[0.04em]">
          <label htmlFor="checkout-provider">
            Tipo de carteira<span className="text-primary"> *</span>
          </label>
          <select
            id="checkout-provider"
            value={flow.provider}
            onChange={(event) => flow.setProvider(event.target.value as typeof flow.provider)}
            className={cn(inputClass, 'mt-2 bg-[#120906] text-[#b9966d]')}
          >
            {walletProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>{provider.label}</option>
            ))}
          </select>
        </div>
        <DisplayField id="checkout-referral" label="Codigo de indicacao" placeholder="Codigo de indicacao" unavailable />
        <TextField flow={flow} field="email" label="E-mail" type="email" autoComplete="email" />
        <div className="grid grid-cols-[minmax(0,1fr)_70px] gap-3">
          <DisplayField id="checkout-ens-name" label="Nome ENS" placeholder=".eth" unavailable />
          <div className="min-w-0 font-mono text-sm tracking-[0.03em]">
            <span className="invisible block">TLD</span>
            <select className={cn(inputClass, 'mt-2 bg-[#120906] text-[#b9966d] disabled:opacity-50')} defaultValue=".eth" aria-label="Sufixo ENS" disabled aria-describedby="checkout-unavailable-note">
              <option>.eth</option>
              <option>.xyz</option>
            </select>
          </div>
        </div>
      </div>
      <p id="checkout-unavailable-note" className="mt-2 font-mono text-xs text-[#a98461]">
        Nome ENS e codigo de indicacao nao estao disponiveis nesta simulacao.
      </p>
      <label className="mt-4 inline-flex items-center gap-2 font-mono text-sm tracking-[0.03em] text-foreground has-[:disabled]:opacity-50">
        <input
          type="checkbox"
          className="size-3.5 accent-[#c57d3b]"
          checked={usingSecondary}
          disabled={!secondaryWallet}
          onChange={(event) => {
            const wallet = event.target.checked ? secondaryWallet : primaryWallet
            if (wallet) flow.selectWallet(wallet.id)
          }}
        />
        Usar outra carteira?
      </label>
      <div className="mt-4 max-w-[420px] font-mono text-sm tracking-[0.03em]">
        <label htmlFor="checkout-note">Observacao do colecionador (opcional)</label>
        <textarea
          id="checkout-note"
          value={flow.values.note}
          onChange={(event) => flow.setField('note', event.target.value)}
          maxLength={280}
          aria-invalid={Boolean(noteError)}
          aria-describedby={noteError ? 'checkout-note-error' : undefined}
          className="mt-2 h-[140px] w-full min-w-0 max-w-full rounded-sm border border-border bg-transparent p-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <FieldError id="checkout-note-error" message={noteError} />
      </div>
    </section>
  )
}

function QuoteLines({ quote }: { quote: QuoteResponse }) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-[minmax(0,1fr)_96px] border-b border-border pb-2 font-mono text-xs font-bold">
        <span>NFTs</span>
        <span className="text-right">Subtotal</span>
      </div>
    <ul className="mt-2 space-y-2">
      {quote.lines.map((line) => (
        <li key={line.nftId} className="grid grid-cols-[56px_minmax(0,1fr)_88px] items-center gap-2 bg-card p-2">
          <img src={line.imageUrl} alt={line.title} className="size-12 rounded-sm bg-[#efe7d2] object-cover" />
          <div className="min-w-0 font-display font-bold">
            <p className="truncate text-sm">
              {line.title} <span className="font-normal text-[#b29274]">(x {line.quantity})</span>
            </p>
            <p className="mt-1 truncate text-xs text-[#b29274]">Edicao: {line.edition}</p>
          </div>
          <p className="text-right font-display text-sm font-bold text-primarySoft">{formatEth(line.subtotalEth)}</p>
        </li>
      ))}
    </ul>
    </div>
  )
}

function QuoteTotals({ quote }: { quote: QuoteResponse }) {
  return (
    <dl className="mt-4 grid gap-3 border-b border-border pb-4 font-mono text-sm">
      <div className="flex min-w-0 justify-between gap-3">
        <dt>Subtotal</dt>
        <dd>{formatEth(quote.subtotalEth)}</dd>
      </div>
      <div className="flex min-w-0 justify-between gap-3">
        <dt>Desconto do lancamento</dt>
        <dd>(-) {formatEth(quote.discountEth)}</dd>
      </div>
      <div>
        <div className="flex min-w-0 justify-between gap-3">
          <dt>Taxa de rede</dt>
          <dd>{formatEth(quote.networkFeeEth)}</dd>
        </div>
        <p className="text-right text-xs text-primarySoft">Taxa estimada</p>
      </div>
      <div className="flex min-w-0 justify-between gap-3 border-t border-border pt-3 text-base font-bold">
        <dt>Total</dt>
        <dd className="text-primarySoft">{formatEth(quote.totalEth)}</dd>
      </div>
    </dl>
  )
}

function CheckoutWalletPanel({ flow }: { flow: CheckoutFlow }) {
  const providerLabel = walletProviders.find((item) => item.id === flow.connection?.provider)?.label

  return (
    <section className="mt-4" aria-labelledby="checkout-wallet-title">
      <h3 id="checkout-wallet-title" className="text-center font-display text-base font-bold">Carteira e rede</h3>
      {flow.wallets.length === 0 ? (
        <p className="mt-3 border border-border p-3 text-sm text-[#caa677]">
          Voce ainda nao tem carteiras cadastradas. <Link to="/carteiras" className="font-bold text-primarySoft underline">Cadastre uma carteira</Link>.
        </p>
      ) : (
        <fieldset className="mt-3 grid gap-3" aria-describedby={flow.errors.walletId ? 'checkout-wallet-error' : undefined}>
          <legend className="sr-only">Carteira cadastrada</legend>
          {flow.wallets.map((wallet) => {
            const checked = wallet.id === flow.selectedWallet?.id
            return (
              <label
                key={wallet.id}
                className={cn(
                  'flex min-w-0 cursor-pointer items-center gap-3 border border-border px-3 py-2 font-mono text-sm',
                  checked && 'border-primary',
                  wallet.status !== 'conectada' && 'opacity-70',
                )}
              >
                <input
                  type="radio"
                  name="checkout-wallet"
                  checked={checked}
                  onChange={() => flow.selectWallet(wallet.id)}
                  className="size-3.5 accent-[#c57d3b]"
                />
                <span className="min-w-0">
                  <span className="block font-bold">{wallet.label}</span>
                  <span className="block truncate text-xs text-[#caa677]">{wallet.network} · {wallet.address}</span>
                </span>
              </label>
            )
          })}
          <FieldError id="checkout-wallet-error" message={flow.errors.walletId} />
        </fieldset>
      )}

      <div className="mt-3 border border-border px-3 py-2">
        <div className="flex flex-wrap gap-2 text-[0.62rem] font-bold uppercase text-primary">
          {walletProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              className={cn('rounded-sm px-2 py-1', flow.provider === provider.id ? 'bg-[#3a1d09]' : 'text-[#9b826d]')}
              onClick={() => flow.setProvider(provider.id)}
            >
              {provider.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 border border-border p-3" aria-live="polite">
        {flow.connection ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-2 text-xs">
              <CheckCircle2 size={16} className="shrink-0 text-success" />
              <span className="truncate">Conectada via {providerLabel} · {flow.connection.network}</span>
            </p>
            <Button variant="secondary" size="sm" onClick={flow.disconnect}>
              <Unlink size={14} />
              Desconectar
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs text-[#caa677]">
              <WalletCards size={16} />
              Carteira desconectada
            </p>
            <Button size="sm" onClick={flow.connect} disabled={!flow.selectedWallet || flow.isConnecting}>
              <Link2 size={14} />
              {flow.isConnecting ? 'Aguardando aprovacao...' : 'Conectar carteira'}
            </Button>
          </div>
        )}
        <FieldError id="checkout-connection-error" message={flow.errors.connection} />
      </div>
    </section>
  )
}

function StaleQuoteNotice() {
  const { quote, reviewChanges, isUpdating } = useCart()
  if (!quote?.stale) return null
  return (
    <Notice>
      <p className="font-bold">A cotacao do carrinho mudou.</p>
      <ul className="mt-1 text-xs text-[#d1b38f]">
        {quote.lines
          .filter((line) => line.issues.length > 0)
          .map((line) => (
            <li key={line.nftId}>
              {line.title}: {line.issues.includes('esgotado') ? 'esgotado' : ''}
              {line.issues.includes('disponibilidade-insuficiente') ? ` apenas ${line.available} disponiveis` : ''}
              {line.issues.includes('preco-alterado') ? ` preco agora ${formatEth(line.unitPriceEth)}` : ''}
            </li>
          ))}
      </ul>
      <button type="button" className="mt-2 text-xs font-bold text-primarySoft underline disabled:opacity-50" onClick={() => void reviewChanges()} disabled={isUpdating}>
        Aceitar valores atuais e ajustar quantidades
      </button>
    </Notice>
  )
}

function ReviewSection({ flow }: { flow: CheckoutFlow }) {
  const payload = flow.reviewedPayload
  if (!payload) return null
  const wallet = flow.wallets.find((item) => item.id === payload.walletId)
  const providerLabel = walletProviders.find((item) => item.id === payload.provider)?.label

  return (
    <section aria-labelledby="review-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="review-title" className="font-display text-xl font-bold">Revise seu pedido</h2>
        {!flow.hasPendingAttempt && (
          <button type="button" className="font-display text-sm font-bold text-primarySoft underline" onClick={flow.backToDetails}>
            Editar dados
          </button>
        )}
      </div>
      <dl className="mt-4 grid gap-3 rounded-xl bg-card p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[#caa677]">Colecionador</dt>
          <dd className="text-right">{payload.collector.displayName} (@{payload.collector.username})</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#caa677]">E-mail</dt>
          <dd className="text-right">{payload.collector.email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#caa677]">Carteira</dt>
          <dd className="text-right">{wallet ? `${wallet.label} · ${wallet.address}` : payload.walletId}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[#caa677]">Rede e tipo</dt>
          <dd className="text-right">{payload.network} · {providerLabel}</dd>
        </div>
        {payload.collector.note && (
          <div className="flex justify-between gap-3">
            <dt className="text-[#caa677]">Observacao</dt>
            <dd className="text-right">{payload.collector.note}</dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-xs text-[#caa677]">
        Ao confirmar, o pagamento simulado e enviado para a carteira. Os itens so saem do carrinho quando o pagamento for confirmado.
      </p>
    </section>
  )
}

export function CheckoutPage() {
  const flow = useCheckoutFlow()
  const { quote, items, isLoading: isCartLoading } = useCart()
  const isReview = flow.step === 'review'
  const summaryQuote = (isReview ? flow.reviewedQuote : null) ?? quote
  const isEmpty = !isCartLoading && items.length === 0 && !flow.hasPendingAttempt

  const actionLabel = flow.isSubmitting
    ? 'Enviando pedido...'
    : flow.hasPendingAttempt
      ? 'Tentar novamente'
      : isReview
        ? 'Confirmar compra'
        : flow.isRevalidating
          ? 'Revalidando cotacao...'
          : 'Revisar pedido'

  const actionDisabled = isReview
    ? flow.isSubmitting || (!flow.hasPendingAttempt && (flow.quoteChangedSinceReview || !flow.connection))
    : flow.isRevalidating || Boolean(quote?.stale) || !summaryQuote

  return (
    <div className="mx-auto max-w-[1440px] overflow-x-hidden px-6 pb-8 pt-8 font-mono sm:px-6 md:pt-9 lg:px-[60px] xl:px-[120px]">
      <header className="grid grid-cols-[44px_1fr] items-center gap-4 md:hidden">
        <Link to="/carrinho" className="grid size-9 place-items-center rounded-full border border-border bg-card text-primarySoft" aria-label="Voltar ao carrinho">
          <ArrowLeft size={19} />
        </Link>
        <h1 className="text-xl font-black tracking-[0.05em]">Pagamento com carteira</h1>
      </header>
      <nav className="hidden font-display text-base font-bold text-foreground md:block" aria-label="Trilha">
        <Link to="/" search={defaultCatalogSearch} className="hover:text-primarySoft">Inicio</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <Link to="/" search={defaultCatalogSearch} hash="catalogo" className="hover:text-primarySoft">Mercado</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <span>Pagamento</span>
      </nav>

      {flow.isLoading ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_405px]" aria-busy="true">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-[420px] rounded-xl" />
        </div>
      ) : flow.loadError ? (
        <div className="mt-8"><Notice tone="error">Nao foi possivel carregar seu perfil e carteiras. Recarregue a pagina.</Notice></div>
      ) : isEmpty ? (
        <div className="mt-8 rounded-xl bg-card p-8 text-center">
          <h2 className="font-display text-2xl font-bold">Seu carrinho esta vazio</h2>
          <Link to="/" search={defaultCatalogSearch} className="mt-4 inline-block font-bold text-primarySoft underline">Explorar o catalogo</Link>
        </div>
      ) : (
        <section className="mt-7 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_405px] lg:gap-10 xl:grid-cols-[minmax(0,760px)_405px] xl:gap-16">
          <div className="min-w-0 space-y-4">
            {flow.notice && <Notice>{flow.notice}</Notice>}
            {isReview ? (
              <ReviewSection flow={flow} />
            ) : (
              <CollectorSection flow={flow} />
            )}
          </div>

          <aside aria-labelledby="checkout-items-title" className="min-w-0 self-start">
            <h2 id="checkout-items-title" className="font-display text-xl font-bold">Seus NFTs</h2>
            <div className="mt-3 space-y-3">
              {!isReview && <StaleQuoteNotice />}
              {isReview && flow.quoteChangedSinceReview && (
                <Notice>
                  <p className="font-bold">A cotacao mudou desde a sua revisao.</p>
                  <button type="button" className="mt-1 text-xs font-bold text-primarySoft underline" onClick={flow.backToDetails}>
                    Revisar novamente
                  </button>
                </Notice>
              )}
            </div>
            {summaryQuote ? (
              <>
                <QuoteLines quote={summaryQuote} />
                {!isReview && (
                  <p className="mt-3 text-center font-mono text-xs text-[#d1b38f]">
                    Tem um codigo promocional? <Link to="/carrinho" className="font-bold text-primarySoft underline">Aplique no carrinho</Link>
                  </p>
                )}
                <QuoteTotals quote={summaryQuote} />
              </>
            ) : (
              <Skeleton className="mt-3 h-[240px] rounded-xl" />
            )}

            {flow.submitError && <div className="mt-4"><Notice tone="error">{flow.submitError}</Notice></div>}

            {!isReview && <CheckoutWalletPanel flow={flow} />}

            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={() => (isReview ? flow.confirm() : void flow.goToReview())}
              disabled={actionDisabled}
              aria-busy={flow.isSubmitting || flow.isRevalidating}
            >
              {actionLabel}
            </Button>
            <Link to="/carrinho" className="mt-4 block text-center font-display text-base text-primarySoft hover:text-primary">
              Voltar ao carrinho
            </Link>
          </aside>
        </section>
      )}
    </div>
  )
}
