import { useState } from 'react'
import type { Nft } from '../types'
import { NftCard } from './NftCard'
import { Skeleton } from './ui/Skeleton'

const perPage = 5

export function NftCarousel({ title, items, isLoading }: { title: string; items: Nft[]; isLoading: boolean }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(items.length / perPage)
  const currentPage = Math.min(page, Math.max(0, totalPages - 1))
  const visible = items.slice(currentPage * perPage, currentPage * perPage + perPage)
  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-titulo`

  if (!isLoading && !items.length) return null

  return (
    <section className="mt-14 md:mt-24" aria-labelledby={titleId}>
      <h2 id={titleId} className="border-b border-border pb-3 font-display text-lg font-bold text-primarySoft md:text-xl">{title}</h2>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-2 md:mt-8 md:gap-7 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: perPage }).map((_, index) => <Skeleton key={index} className="aspect-[0.9] rounded-[14px] md:aspect-[0.78] md:rounded-none" />)
          : visible.map((nft) => <NftCard key={nft.id} nft={nft} />)}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-3">
          {Array.from({ length: totalPages }, (_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              className={
                pageIndex === currentPage
                  ? 'grid size-8 place-items-center rounded-full border border-primary'
                  : 'grid size-8 place-items-center rounded-full border border-transparent transition hover:border-primary'
              }
              aria-label={`${title}: pagina ${pageIndex + 1}`}
              aria-current={pageIndex === currentPage ? 'true' : undefined}
              onClick={() => setPage(pageIndex)}
            >
              <span className={pageIndex === currentPage ? 'size-3 rounded-full bg-primary' : 'size-3 rounded-full border border-primary bg-primary/20'} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
