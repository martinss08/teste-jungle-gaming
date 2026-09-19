import { Link } from '@tanstack/react-router'
import { formatEth } from '../lib/eth'
import type { Nft } from '../types'

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group block">
      <div className="bg-card p-5">
        <div className="aspect-square overflow-hidden rounded-md bg-[#efe7d2]">
          <img src={nft.hero} alt={nft.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
        </div>
      </div>
      <h3 className="mt-3 truncate font-display text-base font-bold text-[#d3c2b3]">{nft.title}</h3>
      <p className="font-display text-lg font-bold text-primarySoft">
        {formatEth(nft.priceEth)}
        {nft.available < 1 && <span className="ml-2 text-xs uppercase text-red-200">Esgotado</span>}
      </p>
    </Link>
  )
}
