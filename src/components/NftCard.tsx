import { Link } from '@tanstack/react-router'
import { formatEth } from '../lib/eth'
import type { Nft } from '../types'

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group block">
      <div className="bg-card p-2 md:p-5">
        <div className="aspect-square overflow-hidden rounded-[14px] bg-[#efe7d2] md:rounded-md">
          <img src={nft.hero} alt={nft.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
        </div>
      </div>
      <h3 className="mt-2 truncate font-display text-sm font-bold text-[#d3c2b3] md:mt-3 md:text-base">{nft.title}</h3>
      <p className="font-display text-base font-bold text-primarySoft md:text-lg">
        {formatEth(nft.priceEth)}
        {nft.available < 1 && <span className="ml-2 text-xs uppercase text-red-200">Esgotado</span>}
      </p>
    </Link>
  )
}
