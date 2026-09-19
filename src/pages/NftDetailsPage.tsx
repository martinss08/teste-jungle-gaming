import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Heart, Linkedin, Mail, Minus, Plus, Search, ShoppingCart, Star, Twitter } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BenefitsSignup } from '../components/BenefitsSignup'
import { NftCarousel } from '../components/NftCarousel'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import type { NftReview, NftReviewsResponse } from '../contracts/api'
import { parseApiError } from '../lib/apiError'
import { formatEth } from '../lib/eth'
import type { Nft } from '../types'
import { useCart } from '../modules/cart/useCart'
import { NotFoundPage } from './NotFoundPage'
import { getNft, getNftReviews, listNfts } from '../modules/catalog/api'
import { defaultCatalogSearch } from '../modules/catalog/search'
import { useFavorites } from '../modules/catalog/useFavorites'
import { keepNewer } from '../modules/realtime/cache'

type PurchaseState = {
  available: number
  remaining: number
  maxQuantity: number
  isAdding: boolean
  feedback: { tone: 'success' | 'error'; message: string } | null
}

type FavoriteState = {
  isFavorite: boolean
  isPending: boolean
  error: string | null
  toggle: () => void
}

const reviewsPerPage = 6

function getPurchaseMessage(purchase: PurchaseState) {
  if (purchase.feedback) return purchase.feedback
  if (purchase.available < 1) return { tone: 'error', message: 'Edicao esgotada.' } as const
  if (purchase.remaining < 1) return { tone: 'error', message: 'Todas as edicoes disponiveis ja estao no seu carrinho.' } as const
  return null
}

function PurchaseStatus({ purchase, className = '' }: { purchase: PurchaseState; className?: string }) {
  const status = getPurchaseMessage(purchase)
  return (
    <p role="status" aria-live="polite" className={`min-h-5 text-sm font-bold ${status?.tone === 'error' ? 'text-red-200' : 'text-success'} ${className}`}>
      {status?.message}
    </p>
  )
}

function availabilityLabel(nft: Nft) {
  return nft.available < 1 ? 'Esgotada' : `${nft.available} ${nft.available === 1 ? 'disponivel' : 'disponiveis'}`
}

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <span aria-hidden="true">
      <span className="text-primary">{'★'.repeat(rounded)}</span>
      <span className="text-[#5f4538]">{'★'.repeat(5 - rounded)}</span>
    </span>
  )
}

function ReviewCard({ review }: { review: NftReview }) {
  return (
    <article className="bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">{review.name}</h3>
          <p className="mt-1 text-sm font-bold text-[#8f7560]">{review.handle}</p>
        </div>
        <div className="text-right font-display text-sm font-bold">
          <p aria-label={`Nota ${review.rating} de 5`}><RatingStars rating={review.rating} /></p>
          <p className="mt-1 text-[#8f7560]">{review.date}</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-bold leading-6 text-[#9b826d]">{review.text}</p>
    </article>
  )
}

function ShareLinks({ nft }: { nft: Nft }) {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`${nft.title} no mercado Kurio`)
  const links = [
    { label: 'Compartilhar no LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, Icon: Linkedin },
    { label: 'Compartilhar por e-mail', href: `mailto:?subject=${text}&body=${url}`, Icon: Mail },
    { label: 'Compartilhar no X', href: `https://twitter.com/intent/tweet?text=${text}&url=${url}`, Icon: Twitter },
  ]

  return (
    <div className="mt-4 flex items-center gap-2 font-display text-base font-bold">
      <span>Compartilhar este NFT:</span>
      {links.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer noopener" aria-label={label} className="text-foreground hover:text-primarySoft">
          <Icon size={17} />
        </a>
      ))}
    </div>
  )
}

function QuantityControl({ quantity, setQuantity, maxQuantity, size }: {
  quantity: number
  setQuantity: Dispatch<SetStateAction<number>>
  maxQuantity: number
  size: 'lg' | 'sm'
}) {
  const buttonClass = size === 'lg'
    ? 'grid size-12 place-items-center rounded-full bg-primary text-[#160b08] disabled:opacity-40'
    : 'grid size-7 place-items-center rounded-full bg-primary text-[#120906] disabled:opacity-40'
  const iconSize = size === 'lg' ? 22 : 15

  return (
    <div className="inline-flex items-center gap-4">
      <button type="button" className={buttonClass} onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Diminuir quantidade">
        <Minus size={iconSize} />
      </button>
      <output aria-live="polite" aria-label="Quantidade" className={size === 'lg' ? 'font-display text-2xl font-bold' : 'text-base font-black'}>
        {quantity}
      </output>
      <button type="button" className={buttonClass} onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={quantity >= maxQuantity} aria-label="Aumentar quantidade">
        <Plus size={iconSize} />
      </button>
    </div>
  )
}

export function NftDetailsPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  // A chave reinicia quantidade, galeria e abas ao navegar para outro NFT.
  return <NftDetails key={nftId} nftId={nftId} />
}

function NftDetails({ nftId }: { nftId: string }) {
  const [quantity, setQuantity] = useState(1)
  const [detailsTab, setDetailsTab] = useState<'details' | 'reviews'>('details')
  const [reviewPage, setReviewPage] = useState(0)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [purchaseFeedback, setPurchaseFeedback] = useState<PurchaseState['feedback']>(null)
  const { addItem, getQuantityInCart, isUpdating } = useCart()
  const favorites = useFavorites()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const nftQuery = useQuery({
    queryKey: ['nft', nftId],
    queryFn: async () => keepNewer(queryClient, ['nft', nftId], await getNft(nftId)),
    retry: false,
  })
  const collection = nftQuery.data?.collection
  const reviewsQuery = useQuery({
    queryKey: ['nft-reviews', nftId],
    queryFn: () => getNftReviews(nftId),
    enabled: nftQuery.isSuccess,
  })
  const relatedQuery = useQuery({
    queryKey: ['nfts', 'related', collection],
    queryFn: ({ signal }) => listNfts({ collection, pageSize: 16 }, signal),
    enabled: Boolean(collection),
  })

  if (nftQuery.isPending) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-[120px]" aria-busy="true">
        <div className="grid gap-8 lg:grid-cols-[604px_1fr]">
          <Skeleton className="aspect-square rounded-[20px]" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-36" />
          </div>
        </div>
      </div>
    )
  }

  if (nftQuery.isError) {
    if (parseApiError(nftQuery.error, '').status === 404) return <NotFoundPage />
    return (
      <div className="grid min-h-[55vh] place-items-center px-6 text-center" role="alert">
        <div>
          <h1 className="font-display text-3xl font-bold">Nao foi possivel carregar este NFT</h1>
          <p className="mt-3 text-sm text-foreground/60">Verifique sua conexao e tente novamente.</p>
          <Button className="mt-5" onClick={() => void nftQuery.refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  const nft = nftQuery.data
  // Disponibilidade restante considera o que ja esta no carrinho; o servidor valida de novo.
  const inCart = getQuantityInCart(nftId)
  const remaining = Math.max(0, nft.available - inCart)
  const maxQuantity = Math.max(1, remaining)
  const addToCart = async () => {
    setPurchaseFeedback(null)
    const result = await addItem(nftId, Math.min(quantity, maxQuantity))
    if (result.ok) {
      setQuantity(1)
      setPurchaseFeedback({ tone: 'success', message: 'Adicionado ao carrinho.' })
    } else {
      setPurchaseFeedback({ tone: 'error', message: result.error })
    }
    return result.ok
  }
  const purchase: PurchaseState = { available: nft.available, remaining, maxQuantity, isAdding: isUpdating, feedback: purchaseFeedback }
  const favorite: FavoriteState = {
    isFavorite: favorites.isFavorite(nftId),
    isPending: favorites.isPending(nftId),
    error: favorites.error,
    toggle: () => favorites.toggleFavorite(nftId),
  }

  const images = nft.gallery?.length ? nft.gallery : [nft.hero]
  const currentImage = activeImage ?? images[0]
  const reviews = reviewsQuery.data
  const reviewItems = reviews?.items ?? []
  const reviewTotalPages = Math.ceil(reviewItems.length / reviewsPerPage)
  const visibleReviews = reviewItems.slice(reviewPage * reviewsPerPage, reviewPage * reviewsPerPage + reviewsPerPage)
  const related = (relatedQuery.data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, 15)

  return (
    <>
      <MobileNftDetails
        nft={nft}
        reviews={reviews}
        quantity={quantity}
        setQuantity={setQuantity}
        addToCart={() => void addToCart()}
        buyNow={async () => {
          if (await addToCart()) void navigate({ to: '/carrinho' })
        }}
        purchase={purchase}
        favorite={favorite}
      />

      <div className="bg-[#120906] px-6 pb-12 font-mono text-foreground md:hidden">
        <NftCarousel title="Mais desta colecao" items={related} isLoading={relatedQuery.isPending} />
        <BenefitsSignup />
      </div>

      <div className="mx-auto hidden max-w-[1440px] px-4 pb-14 pt-9 sm:px-6 md:block lg:px-[120px]">
      <nav className="font-display text-base font-bold text-foreground" aria-label="Trilha">
        <Link to="/" search={defaultCatalogSearch} className="hover:text-primarySoft">Inicio</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <Link to="/" search={defaultCatalogSearch} hash="catalogo" className="hover:text-primarySoft">Mercado</Link>
      </nav>

      <section className="mt-4 grid gap-8 lg:grid-cols-[604px_1fr]">
        <div className="grid gap-6 sm:grid-cols-[90px_490px]">
          <div className="order-2 flex gap-4 overflow-x-auto sm:order-1 sm:block sm:space-y-4" role="group" aria-label="Galeria de imagens">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                className={`size-[90px] shrink-0 overflow-hidden rounded-md border bg-[#efe7d2] ${image === currentImage ? 'border-primary' : 'border-transparent'}`}
                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                aria-pressed={image === currentImage}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div className="order-1 self-start bg-card p-5 sm:order-2">
            <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[#efe7d2] lg:size-[450px]">
              <img src={currentImage} alt={`Arte principal do NFT ${nft.title}`} className="h-full w-full object-cover" />
              <a href={currentImage} target="_blank" rel="noreferrer noopener" className="absolute right-0 top-0 grid size-9 place-items-center rounded-full bg-[#2a170f] text-foreground" aria-label="Abrir imagem em tamanho real">
                <Search size={22} />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <div className="border-b border-border pb-3">
            <h1 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-[2rem]">
              {nft.title}
            </h1>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-2xl font-bold text-primarySoft">
                {formatEth(nft.priceEth)}
                {nft.previousPriceEth && <span className="ml-3 text-base text-[#7b6554] line-through">{formatEth(nft.previousPriceEth)}</span>}
              </p>
              <div className="font-display text-sm font-bold text-[#bca38d]">
                {reviews ? (
                  <>
                    <span aria-label={`Nota media ${reviews.averageRating} de 5`}><RatingStars rating={reviews.averageRating} /></span>
                    <span className="ml-2">{reviews.total} avaliacoes de colecionadores</span>
                  </>
                ) : (
                  <Skeleton className="h-5 w-48" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 max-w-[610px]">
            <h2 className="font-display text-base font-bold">Sobre este NFT:</h2>
            <p className="mt-3 text-base font-bold leading-7 text-[#9b826d]">{nft.description}</p>

            <h2 className="mt-4 font-display text-base font-bold">Edicao:</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-primary bg-primary/10 px-2.5 py-1 font-display text-sm font-bold text-primary">{nft.edition}</span>
              <span className={`font-display text-sm font-bold ${nft.available < 1 ? 'text-red-200' : 'text-[#a98461]'}`}>{availabilityLabel(nft)}</span>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <QuantityControl quantity={quantity} setQuantity={setQuantity} maxQuantity={maxQuantity} size="lg" />

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="min-w-[150px]" onClick={() => void addToCart()} disabled={remaining < 1 || isUpdating}>
                  Comprar
                </Button>
                <Button
                  variant="secondary"
                  className="min-w-[145px] border-primary text-primarySoft"
                  onClick={favorite.toggle}
                  disabled={favorite.isPending}
                  aria-pressed={favorite.isFavorite}
                >
                  <Heart size={18} className={favorite.isFavorite ? 'fill-current' : ''} />
                  {favorite.isFavorite ? 'Favorito' : 'Favoritar'}
                </Button>
              </div>
            </div>
            <PurchaseStatus purchase={purchase} className="mt-3" />
            {favorite.error && <p role="alert" className="mt-2 text-sm font-bold text-red-200">{favorite.error}</p>}

            <dl className="mt-5 grid gap-3 font-display text-base font-bold text-[#9b826d]">
              <div>Colecao: {nft.collection}</div>
              <div>Criador: {nft.creator}</div>
              <div>Atributos: {nft.traits.join(', ')}</div>
            </dl>

            <ShareLinks nft={nft} />
          </div>
        </div>
      </section>

      <section className="mt-24">
        <div className="flex flex-wrap gap-9 border-b border-border font-display text-lg font-bold">
          <button
            type="button"
            className={detailsTab === 'details' ? 'border-b-2 border-primary pb-3 text-primary' : 'pb-3 text-[#bca38d] hover:text-primarySoft'}
            aria-pressed={detailsTab === 'details'}
            onClick={() => setDetailsTab('details')}
          >
            Detalhes do NFT
          </button>
          <button
            type="button"
            className={detailsTab === 'reviews' ? 'border-b-2 border-primary pb-3 text-primary' : 'pb-3 text-[#bca38d] hover:text-primarySoft'}
            aria-pressed={detailsTab === 'reviews'}
            onClick={() => {
              setDetailsTab('reviews')
              setReviewPage(0)
            }}
          >
            Avaliacoes de colecionadores{reviews ? ` (${reviews.total})` : ''}
          </button>
        </div>

        {detailsTab === 'details' ? (
          <dl className="mt-4 grid gap-5 text-base font-bold leading-7 text-[#9b826d]">
            <div>
              <dt className="font-display text-foreground">Descricao:</dt>
              <dd>{nft.description}</dd>
            </div>
            <div>
              <dt className="font-display text-foreground">Rede:</dt>
              <dd>{nft.network}</dd>
            </div>
            <div>
              <dt className="font-display text-foreground">Raridade e edicao:</dt>
              <dd className="capitalize">{nft.rarity} · {nft.edition}</dd>
            </div>
            <div>
              <dt className="font-display text-foreground">Atributos:</dt>
              <dd>{nft.traits.join(', ')}</dd>
            </div>
          </dl>
        ) : reviewsQuery.isError ? (
          <div className="mt-6 bg-card p-6 text-center" role="alert">
            <p className="font-bold">Nao foi possivel carregar as avaliacoes.</p>
            <Button className="mt-4" onClick={() => void reviewsQuery.refetch()}>Tentar novamente</Button>
          </div>
        ) : !reviews ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-none" />)}
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {visibleReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            {reviewTotalPages > 1 && (
              <nav className="mt-7 flex justify-end gap-2" aria-label="Paginacao das avaliacoes">
                {Array.from({ length: reviewTotalPages }, (_, pageIndex) => (
                  <button
                    key={pageIndex}
                    type="button"
                    className={
                      pageIndex === reviewPage
                        ? 'grid size-8 place-items-center rounded-sm bg-primary text-sm font-bold text-[#160b08]'
                        : 'grid size-8 place-items-center rounded-sm border border-border text-sm font-bold text-[#9a806a] transition hover:border-primary hover:text-primarySoft'
                    }
                    aria-current={pageIndex === reviewPage ? 'page' : undefined}
                    onClick={() => setReviewPage(pageIndex)}
                  >
                    {pageIndex + 1}
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
      </section>

      <NftCarousel title="Mais desta colecao" items={related} isLoading={relatedQuery.isPending} />

      <BenefitsSignup />
      </div>
    </>
  )
}

function MobileNftDetails({
  nft,
  reviews,
  quantity,
  setQuantity,
  addToCart,
  buyNow,
  purchase,
  favorite,
}: {
  nft: Nft
  reviews?: NftReviewsResponse
  quantity: number
  setQuantity: Dispatch<SetStateAction<number>>
  addToCart: () => void
  buyNow: () => void
  purchase: PurchaseState
  favorite: FavoriteState
}) {
  const cannotBuy = purchase.remaining < 1 || purchase.isAdding

  return (
    <div className="min-h-screen bg-[#120906] font-mono text-foreground md:hidden">
      <div className="relative px-7 pt-6">
        <Link to="/" search={defaultCatalogSearch} className="absolute left-7 top-6 z-20 grid size-9 place-items-center rounded-full border border-border bg-card/70 text-primarySoft" aria-label="Voltar">
          <ArrowLeft size={20} />
        </Link>
        <button
          type="button"
          className="absolute right-7 top-6 z-20 grid size-9 place-items-center rounded-full border border-border bg-card/70 text-primarySoft disabled:opacity-50"
          aria-label={favorite.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          aria-pressed={favorite.isFavorite}
          disabled={favorite.isPending}
          onClick={favorite.toggle}
        >
          <Heart size={18} className={favorite.isFavorite ? 'fill-current' : ''} />
        </button>
        <img src={nft.hero} alt={nft.title} className="h-[395px] w-full rounded-[20px] object-cover" />
      </div>

      <section className="-mt-[70px] relative z-10 rounded-t-[24px] bg-card px-6 pb-8 pt-8 shadow-[0_-20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-black tracking-[0.03em]">{nft.title}</h1>
          {reviews && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-1 text-xs font-bold" aria-label={`Nota media ${reviews.averageRating} de 5, ${reviews.total} avaliacoes`}>
              <Star size={13} className="fill-primary text-primary" />
              {reviews.averageRating.toFixed(1)}({reviews.total})
            </span>
          )}
        </div>
        {favorite.error && <p role="alert" className="mt-3 text-xs font-bold text-red-200">{favorite.error}</p>}
        <p className="mt-4 text-sm font-medium leading-7 text-[#d1b38f]">{nft.description}</p>

        <h2 className="mt-4 text-sm font-black">Edicao:</h2>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="rounded-full border border-primary px-2 py-1 text-primarySoft">{nft.edition}</span>
          <span className={nft.available < 1 ? 'text-red-200' : 'text-[#d1b38f]'}>{availabilityLabel(nft)}</span>
        </div>

        <dl className="mt-4 grid gap-3 text-sm text-[#caa677]">
          <div>Colecao: {nft.collection}</div>
          <div>Criador: {nft.creator}</div>
          <div>Atributos: {nft.traits.join(', ')}</div>
        </dl>

        <div className="mt-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#d1b38f]">Qtd.</span>
            <QuantityControl quantity={quantity} setQuantity={setQuantity} maxQuantity={purchase.maxQuantity} size="sm" />
          </div>
          <p className="text-xl font-black text-primarySoft">{formatEth(nft.priceEth)}</p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="button" className="h-[58px] flex-1 rounded-[28px] bg-primary text-sm font-black text-[#120906] disabled:opacity-50" onClick={buyNow} disabled={cannotBuy}>
            Comprar NFT
          </button>
          <button type="button" className="grid size-[58px] place-items-center rounded-full border border-border bg-[#2e1a12] text-[#d1b38f] disabled:opacity-50" onClick={addToCart} disabled={cannotBuy} aria-label="Adicionar ao carrinho">
            <ShoppingCart size={21} className="fill-current" />
          </button>
        </div>
        <PurchaseStatus purchase={purchase} className="mt-3" />
      </section>
    </div>
  )
}
