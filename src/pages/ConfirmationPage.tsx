import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearch } from '@tanstack/react-router'
import { CheckCircle2, Clock3, ExternalLink, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { buttonVariants } from '../components/ui/buttonVariants'
import { Skeleton } from '../components/ui/Skeleton'
import { Card } from '../components/ui/Card'
import type { Order } from '../contracts/api'
import { parseApiError } from '../lib/apiError'
import { formatEth } from '../lib/eth'
import { useAuth } from '../modules/auth/useAuth'
import { getOrder } from '../modules/checkout/api'
import { keepNewer } from '../modules/realtime/cache'
import { useRealtime } from '../modules/realtime/useRealtime'
import { defaultCatalogSearch } from '../modules/catalog/search'

const statusContent = {
  pendente: {
    icon: <Clock3 className="mx-auto animate-pulse text-primarySoft" size={54} />,
    title: 'Aguardando confirmacao',
    description: 'O pagamento foi enviado e esta sendo processado na rede. Esta pagina atualiza sozinha.',
  },
  recusado: {
    icon: <XCircle className="mx-auto text-red-300" size={54} />,
    title: 'Pagamento recusado',
    description: 'A carteira recusou o pagamento. Nenhum valor foi cobrado e seus itens continuam no carrinho.',
  },
} as const

function Receipt({ order }: { order: Order }) {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-2">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primarySoft">Identificacao</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-foreground/55">Pedido</dt>
            <dd className="font-semibold">{order.id}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground/55">Carteira</dt>
            <dd className="text-right font-semibold">{order.wallet.label} · {order.wallet.address}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground/55">Rede</dt>
            <dd className="font-semibold">{order.network}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground/55">Data</dt>
            <dd className="font-semibold">{new Date(order.createdAt).toLocaleString('pt-BR')}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-3">
            <dt className="text-foreground/55">Subtotal</dt>
            <dd className="font-semibold">{formatEth(order.subtotalEth)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground/55">Desconto{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
            <dd className="font-semibold">(-) {formatEth(order.discountEth)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground/55">Taxa de rede</dt>
            <dd className="font-semibold">{formatEth(order.networkFeeEth)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-3">
            <dt className="text-foreground/55">Total</dt>
            <dd className="font-bold text-primarySoft">{formatEth(order.totalEth)}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primarySoft">Itens</h2>
        <ul className="mt-4 grid gap-3">
          {order.items.map((item) => (
            <li key={item.nftId} className="flex items-center gap-3 rounded-md border border-border bg-[#170d0a] p-3">
              <img src={item.imageUrl} alt="" className="size-12 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="text-xs text-foreground/50">
                  Edicao {item.edition} · {item.quantity} x {formatEth(item.unitPriceEth)}
                </p>
              </div>
              <p className="text-sm font-semibold text-primarySoft">{formatEth(item.subtotalEth)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ThankYouIcon() {
  return (
    <div className="relative mx-auto h-[78px] w-[78px] text-primarySoft" aria-hidden="true">
      <div className="absolute left-1/2 top-0 h-4 w-5 -translate-x-1/2 rounded-t-full border-2 border-current border-b-0" />
      <div className="absolute inset-x-2 top-3 h-[58px] rounded-sm border-2 border-current">
        <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="absolute left-0 top-5 h-10 w-10 origin-top-left rotate-45 border-b-2 border-r-2 border-current" />
          <div className="absolute right-0 top-5 h-10 w-10 origin-top-right -rotate-45 border-b-2 border-l-2 border-current" />
        </div>
        <span className="absolute left-1/2 top-2 -translate-x-1/2 text-center font-display text-[0.68rem] font-black leading-[0.78rem]">
          THANK<br />YOU
        </span>
      </div>
    </div>
  )
}

function PaymentToast({ orderId }: { orderId: string }) {
  const [hiddenOrderId, setHiddenOrderId] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setHiddenOrderId(orderId), 5000)
    return () => window.clearTimeout(timeout)
  }, [orderId])

  if (hiddenOrderId === orderId) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-5 top-5 z-[70] flex max-w-[320px] items-center gap-3 border border-primary bg-card px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
    >
      <CheckCircle2 size={20} className="shrink-0 text-success" />
      <div>
        <p className="font-display text-sm font-bold text-foreground">Pagamento confirmado</p>
        <p className="mt-0.5 font-mono text-xs text-[#caa677]">Seus NFTs foram adicionados a sua carteira.</p>
      </div>
    </div>
  )
}

function ConfirmedReceipt({ order }: { order: Order }) {
  const dateLabel = new Date(order.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10">
      <PaymentToast orderId={order.id} />
      <div className="border-b-8 border-primary bg-card shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="px-8 pb-5 pt-7 text-center" role="status" aria-live="polite">
          <ThankYouIcon />
          <h1 className="mt-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-primary">Pedido confirmado</h1>
          <p className="mt-2 font-display text-lg font-bold tracking-[0.08em] text-[#d7b895]">Seus NFTs agora estao na sua carteira</p>
        </div>

        <dl className="grid border-y border-primary/70 font-mono text-sm text-[#d7b895] sm:grid-cols-[1.2fr_0.85fr_0.85fr_0.85fr]">
          <div className="border-b border-primary/40 px-8 py-4 sm:border-b-0 sm:border-r">
            <dt className="font-bold text-foreground">ID da transacao</dt>
            <dd className="mt-1 break-all">{order.transaction}</dd>
          </div>
          <div className="border-b border-primary/40 px-8 py-4 sm:border-b-0 sm:border-r sm:px-5">
            <dt>Data</dt>
            <dd className="mt-1">{dateLabel}</dd>
          </div>
          <div className="border-b border-primary/40 px-8 py-4 sm:border-b-0 sm:border-r sm:px-5">
            <dt>Pedido</dt>
            <dd className="mt-1 break-all">{order.id}</dd>
          </div>
          <div className="px-8 py-4 sm:px-5">
            <dt className="font-bold text-foreground">Carteira</dt>
            <dd className="mt-1">{order.wallet.label}</dd>
          </div>
        </dl>

        <div className="px-8 pb-8 pt-5">
          <h2 className="font-display text-base font-bold">Detalhes da transacao</h2>
          <div className="mt-3 hidden grid-cols-[minmax(0,1fr)_92px_112px] border-b border-border pb-2 font-display text-base font-bold sm:grid" aria-hidden="true">
            <span>NFTs</span>
            <span className="text-center">Edicoes</span>
            <span className="text-right">Subtotal</span>
          </div>
          <ul className="mt-3 space-y-3">
            {order.items.map((item) => (
              <li key={item.nftId} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[64px_minmax(0,1fr)_92px_112px]">
                <img src={item.imageUrl} alt={item.title} className="row-span-2 size-16 rounded-sm bg-[#efe7d2] object-cover sm:row-span-1" />
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <p className="truncate font-display text-base font-bold">{item.title}</p>
                  <p className="mt-1 truncate font-mono text-xs text-[#b29274]">
                    Edicao {item.edition} · {item.quantity} x {formatEth(item.unitPriceEth)}
                  </p>
                </div>
                <p className="font-mono text-sm text-[#d7b895] sm:text-center">(x {item.quantity})</p>
                <p className="text-right font-display text-lg font-bold text-primarySoft">{formatEth(item.subtotalEth)}</p>
              </li>
            ))}
          </ul>

          <dl className="ml-auto mt-5 grid max-w-[360px] gap-3 border-b border-border pb-4 font-mono text-base">
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd>{formatEth(order.subtotalEth)}</dd>
            </div>
            {order.couponCode && (
              <div className="flex justify-between gap-4">
                <dt>Desconto ({order.couponCode})</dt>
                <dd>(-) {formatEth(order.discountEth)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt>Taxa de rede</dt>
              <dd>{formatEth(order.networkFeeEth)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-bold">
              <dt>Total</dt>
              <dd className="font-display text-xl text-primarySoft">{formatEth(order.totalEth)}</dd>
            </div>
          </dl>

          <p className="mx-auto mt-4 max-w-[500px] text-center font-mono text-sm leading-6 text-[#caa677]">
            Transacao confirmada na {order.network}. A propriedade foi transferida para sua carteira conectada e registrada na rede.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/perfil" hash="colecao" className={buttonVariants({ className: 'min-w-[190px] font-display text-base font-bold' })}>
              Ver minha colecao
            </Link>
            <a
              href={order.explorerUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonVariants({ variant: 'secondary', className: 'min-w-[190px] font-display text-base font-bold' })}
            >
              Ver no explorador (simulado)
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConfirmationPage() {
  const { pedido } = useSearch({ from: '/confirmacao' })
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { status: realtimeStatus } = useRealtime()
  const orderKey = ['order', session?.user.id, pedido]
  const orderQuery = useQuery({
    queryKey: orderKey,
    queryFn: async () => keepNewer(queryClient, orderKey, await getOrder(pedido)),
    enabled: Boolean(pedido && session),
    retry: false,
    // Confirmacao/recusa chegam por `order.updated`; sem socket conectado, consulta periodica como fallback.
    refetchInterval: (query) => (query.state.data?.status === 'pendente' && realtimeStatus !== 'connected' ? 3000 : false),
  })
  const order = orderQuery.data
  const status = order?.status

  // Liquidacao confirmada consome carrinho e estoque no servidor: ressincroniza caches.
  useEffect(() => {
    if (status !== 'confirmado') return
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: ['quote'] })
    void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    void queryClient.invalidateQueries({ queryKey: ['nft'] })
    void queryClient.invalidateQueries({ queryKey: ['collection', session?.user.id] })
  }, [status, queryClient, session?.user.id])

  const errorStatus = orderQuery.isError ? parseApiError(orderQuery.error, '').status : undefined
  if (!pedido || errorStatus === 404 || errorStatus === 403) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">{errorStatus === 403 ? 'Pedido de outra conta' : 'Pedido nao encontrado'}</h1>
        <p className="mt-3 text-foreground/60">
          {errorStatus === 403 ? 'Este pedido nao pertence a conta conectada.' : 'Confira o link ou volte ao catalogo.'}
        </p>
        <Link to="/" search={defaultCatalogSearch} className={buttonVariants({ className: 'mt-6' })}>
          Voltar ao catalogo
        </Link>
      </div>
    )
  }

  if (orderQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center" role="alert">
        <h1 className="font-display text-3xl font-bold">Nao foi possivel carregar o pedido</h1>
        <Button className="mt-6" onClick={() => void orderQuery.refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true">
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    )
  }

  if (order.status === 'confirmado') return <ConfirmedReceipt order={order} />

  const content = statusContent[order.status]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden">
        <div className="bg-secondary/70 p-6 text-center" role="status" aria-live="polite">
          {content.icon}
          <h1 className="mt-4 font-display text-4xl font-bold">{content.title}</h1>
          <p className="mt-2 text-foreground/65">{content.description}</p>
          {order.status === 'pendente' && (
            <p className="mt-3 text-xs text-foreground/50">
              {realtimeStatus === 'connected' ? 'Acompanhando em tempo real.' : 'Reconectando ao tempo real; consultando o pedido periodicamente.'}
            </p>
          )}
        </div>
        <Receipt order={order} />
        <div className="flex flex-col gap-3 border-t border-border p-6 sm:flex-row">
          {order.status === 'recusado' ? (
            <Link to="/carrinho" className={buttonVariants()}>Voltar ao carrinho</Link>
          ) : (
            <Link to="/" search={defaultCatalogSearch} className={buttonVariants()}>Voltar ao catalogo</Link>
          )}
        </div>
      </Card>
    </div>
  )
}
