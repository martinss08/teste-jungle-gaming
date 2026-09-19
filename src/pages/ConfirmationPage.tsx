import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearch } from '@tanstack/react-router'
import { CheckCircle2, Clock3, ExternalLink, XCircle } from 'lucide-react'
import { useEffect } from 'react'
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
  confirmado: {
    icon: <CheckCircle2 className="mx-auto text-success" size={54} />,
    title: 'Pedido confirmado',
    description: 'Pagamento confirmado. Este recibo e um registro imutavel da sua compra.',
  },
  recusado: {
    icon: <XCircle className="mx-auto text-red-300" size={54} />,
    title: 'Pagamento recusado',
    description: 'A carteira recusou o pagamento. Nenhum valor foi cobrado e seus itens continuam no carrinho.',
  },
} as const

function Receipt({ order }: { order: Order }) {
  const isConfirmed = order.status === 'confirmado'
  return (
    <div className="grid gap-6 p-6 md:grid-cols-2">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primarySoft">Identificacao</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-foreground/55">Pedido</dt>
            <dd className="font-semibold">{order.id}</dd>
          </div>
          {isConfirmed && (
            <div className="flex justify-between gap-3">
              <dt className="text-foreground/55">Transacao</dt>
              <dd className="font-semibold">{order.transaction}</dd>
            </div>
          )}
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
  }, [status, queryClient])

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
          {order.status === 'confirmado' && (
            <a href={order.explorerUrl} target="_blank" rel="noreferrer noopener" className={buttonVariants({ variant: 'secondary' })}>
              Ver no explorador (simulado)
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </Card>
    </div>
  )
}
