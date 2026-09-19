import { Link } from '@tanstack/react-router'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { nfts, recentOrder } from '../data/nfts'
import { formatEth } from '../lib/eth'
import { useCart } from '../modules/cart/useCart'

const homeSearch = { q: '', rarity: 'todos', sort: 'recentes', page: 1 }

export function ConfirmationPage() {
  const { totalEth, networkFeeEth } = useCart()
  const orderItems = recentOrder.items.map((line) => ({
    ...line,
    nft: nfts.find((item) => item.id === line.nftId),
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden">
        <div className="bg-secondary/70 p-6 text-center">
          <CheckCircle2 className="mx-auto text-success" size={54} />
          <h1 className="mt-4 font-display text-4xl font-bold">Pedido confirmado</h1>
          <p className="mt-2 text-foreground/65">Sua compra simulada foi processada com sucesso.</p>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primarySoft">Identificacao</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-foreground/55">Pedido</dt>
                <dd className="font-semibold">{recentOrder.id}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground/55">Transacao</dt>
                <dd className="font-semibold">{recentOrder.transaction}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground/55">Taxa</dt>
                <dd className="font-semibold">{formatEth(networkFeeEth)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3">
                <dt className="text-foreground/55">Total</dt>
                <dd className="font-bold text-primarySoft">{formatEth(totalEth)}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-primarySoft">Itens</h2>
            <div className="mt-4 grid gap-3">
              {orderItems.map(({ nft, quantity }) =>
                nft ? (
                  <div key={nft.id} className="flex items-center gap-3 rounded-md border border-border bg-[#170d0a] p-3">
                    <img src={nft.hero} alt="" className="size-12 rounded-md object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{nft.title}</p>
                      <p className="text-xs text-foreground/50">Quantidade {quantity}</p>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-border p-6 sm:flex-row">
          <Link to="/" search={homeSearch}>
            <Button>Voltar ao catalogo</Button>
          </Link>
          <Button variant="secondary">
            Ver explorador simulado
            <ExternalLink size={16} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
