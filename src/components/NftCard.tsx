import { Link } from '@tanstack/react-router'
import { Heart, ShoppingBag } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { formatEth } from '../lib/utils'
import type { Nft } from '../types'
import { useCart } from '../modules/cart/useCart'

export function NftCard({ nft, compact = false }: { nft: Nft; compact?: boolean }) {
  const { addItem } = useCart()

  return (
    <Card className="group overflow-hidden">
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block">
        <div className="aspect-square overflow-hidden bg-[#eadfc6]" style={{ backgroundColor: nft.accent }}>
          <img
            src={nft.hero}
            alt={`Arte do NFT ${nft.title}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/nft/$nftId"
              params={{ nftId: nft.id }}
              className="block truncate font-bold text-foreground hover:text-primarySoft"
            >
              {nft.title}
            </Link>
            <p className="truncate text-xs text-foreground/50">{nft.creator}</p>
          </div>
          <button
            type="button"
            className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-foreground/60 hover:border-primary/70 hover:text-primarySoft"
            aria-label={`Favoritar ${nft.title}`}
          >
            <Heart size={16} />
          </button>
        </div>
        {!compact && (
          <div className="flex flex-wrap gap-2">
            <Badge>{nft.rarity}</Badge>
            <Badge className="border-secondary bg-secondary/60 text-success">{nft.network}</Badge>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="block text-[0.68rem] uppercase tracking-[0.16em] text-foreground/45">Preco</span>
            <strong className="text-sm text-primarySoft">{formatEth(nft.priceEth)}</strong>
          </div>
          <Button size="sm" onClick={() => addItem(nft.id)}>
            <ShoppingBag size={15} />
            Comprar
          </Button>
        </div>
      </div>
    </Card>
  )
}
