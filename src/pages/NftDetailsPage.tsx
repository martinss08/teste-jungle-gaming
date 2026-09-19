import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Heart, Linkedin, Mail, Minus, Plus, Search, ShoppingCart, Star, Twitter } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Button } from '../components/ui/Button'
import { nfts } from '../data/nfts'
import { formatEth } from '../lib/utils'
import type { Nft } from '../types'
import { useCart } from '../modules/cart/useCart'
import { NotFoundPage } from './NotFoundPage'
import { addFavorite, getFavorites, getNft, removeFavorite } from '../modules/catalog/api'
import { useAuth } from '../modules/auth/useAuth'
import type { FavoriteResponse } from '../contracts/api'
import { useProtectedAction } from '../modules/auth/useProtectedAction'
import { keepNewer } from '../modules/realtime/cache'

const homeSearch = { q: '', rarity: 'todos', sort: 'recentes', page: 1 }

type PurchaseState = {
  remaining: number
  maxQuantity: number
  isAdding: boolean
  feedback: { tone: 'success' | 'error'; message: string } | null
}

function PurchaseStatus({ purchase, className = '' }: { purchase: PurchaseState; className?: string }) {
  const message =
    purchase.feedback?.message ??
    (purchase.remaining < 1 ? 'Todas as edicoes disponiveis ja estao no seu carrinho ou esgotaram.' : null)
  const isError = purchase.feedback ? purchase.feedback.tone === 'error' : purchase.remaining < 1

  return (
    <p role="status" aria-live="polite" className={`min-h-5 text-sm font-bold ${isError ? 'text-red-200' : 'text-success'} ${className}`}>
      {message}
    </p>
  )
}

function EditionPill({ children, active = false }: { children: string; active?: boolean }) {
  return (
    <span
      className={
        active
          ? 'rounded-full border border-primary bg-primary/10 px-2.5 py-1 font-display text-sm font-bold text-primary'
          : 'rounded-full border border-primary/55 px-2.5 py-1 font-display text-sm font-bold text-[#a98461]'
      }
    >
      {children}
    </span>
  )
}

function RelatedCard({ nft, index }: { nft: Nft; index: number }) {
  const code = ['118', '314', '088', '207', '160'][index] ?? String(index + 42)
  const names = ['Cosmic Bloom', 'Violet Nomad', 'Ivory Baron', 'Golden Beat', 'Golden Signal']
  const displayIndex = index % names.length

  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group block">
      <div className="bg-card p-5">
        <div className="aspect-square overflow-hidden rounded-md bg-[#efe7d2]">
          <img src={nft.hero} alt={nft.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
        </div>
      </div>
      <h3 className="mt-3 truncate font-display text-base font-bold text-[#bca38d]">
        {names[displayIndex] ?? nft.title} #{code}
      </h3>
      <p className="font-display text-lg font-bold text-primarySoft">
        {formatEth((Number(nft.priceEth) * (0.72 + index * 0.05)).toFixed(2))}
      </p>
    </Link>
  )
}

function BenefitsSignup() {
  return (
    <section className="mt-24 bg-card">
      <div className="grid gap-0 md:grid-cols-4">
        {[
          ['W', 'Seguranca da carteira', 'Proteja sua carteira e colecione arte digital verificada com confianca.'],
          ['C', 'Criadores em destaque', 'Conheca artistas, estudios e comunidades que moldam a cultura digital na rede.'],
          ['D', 'Alertas de lancamentos', 'Receba calendarios de cunhagem, novidades de listas de acesso e analises do mercado.'],
        ].map(([letter, title, text]) => (
          <div key={title} className="border-b border-border p-8 md:border-b-0 md:border-r">
            <span className="grid size-16 place-items-center rounded-full bg-primary font-display text-xl font-bold text-[#160b08]">{letter}</span>
            <h3 className="mt-5 font-display text-base font-bold">{title}</h3>
            <p className="mt-3 text-sm font-bold leading-6 text-[#9b826d]">{text}</p>
          </div>
        ))}
        <div className="p-8">
          <h3 className="font-display text-base font-bold">Antecipe-se ao proximo lancamento</h3>
          <div className="mt-5 flex overflow-hidden rounded-sm border border-border bg-[#160b08]">
            <input className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground outline-none" placeholder="Digite seu e-mail..." />
            <Button className="rounded-none">Enviar</Button>
          </div>
          <p className="mt-4 text-xs font-bold leading-5 text-[#9b826d]">Receba lancamentos selecionados, historias de criadores e novidades do mercado.</p>
        </div>
      </div>
    </section>
  )
}

export function NftDetailsPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const [quantity, setQuantity] = useState(1)
  const [relatedPage, setRelatedPage] = useState(0)
  const { addItem, getQuantityInCart, isUpdating } = useCart()
  const [purchaseFeedback, setPurchaseFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const { isAuthenticated } = useAuth()
  const runProtected = useProtectedAction()
  const queryClient = useQueryClient()
  const nftQuery = useQuery({
    queryKey: ['nft', nftId],
    queryFn: async () => keepNewer(queryClient, ['nft', nftId], await getNft(nftId)),
    retry: false,
  })
  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated,
    retry: false,
  })
  const nft = nftQuery.data
  const isFavorite = Boolean(favoritesQuery.data?.nftIds.includes(nftId))
  const favoriteMutation = useMutation({
    mutationFn: () => (isFavorite ? removeFavorite(nftId) : addFavorite(nftId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previous = queryClient.getQueryData<FavoriteResponse>(['favorites'])
      queryClient.setQueryData<FavoriteResponse>(['favorites'], {
        nftIds: isFavorite
          ? (previous?.nftIds ?? []).filter((id) => id !== nftId)
          : [...(previous?.nftIds ?? []), nftId],
      })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['favorites'], context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
  // Disponibilidade restante considera o que ja esta no carrinho; o servidor valida de novo.
  const inCart = getQuantityInCart(nftId)
  const remaining = Math.max(0, (nft?.available ?? 0) - inCart)
  const maxQuantity = Math.max(1, remaining)
  const handleBuy = async () => {
    setPurchaseFeedback(null)
    const result = await addItem(nftId, Math.min(quantity, maxQuantity))
    if (result.ok) {
      setQuantity(1)
      setPurchaseFeedback({ tone: 'success', message: 'Adicionado ao carrinho.' })
    } else {
      setPurchaseFeedback({ tone: 'error', message: result.error })
    }
  }
  const purchase = { remaining, maxQuantity, isAdding: isUpdating, feedback: purchaseFeedback }
  const handleFavorite = () => runProtected(() => favoriteMutation.mutate())

  if (nftQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-[120px]">
        <div className="grid gap-8 lg:grid-cols-[604px_1fr]">
          <div className="aspect-square animate-pulse rounded-[20px] bg-card" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-card" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-card" />
            <div className="h-36 animate-pulse rounded bg-card" />
          </div>
        </div>
      </div>
    )
  }

  if (!nft || (axios.isAxiosError(nftQuery.error) && nftQuery.error.response?.status === 404)) return <NotFoundPage />
  if (nftQuery.isError) {
    return (
      <div className="grid min-h-[55vh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold">Nao foi possivel carregar este NFT</h1>
          <p className="mt-3 text-sm text-foreground/60">Tente novamente em alguns instantes.</p>
          <Button className="mt-5" onClick={() => void nftQuery.refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  const relatedPool = nfts.filter((item) => item.id !== nft.id)
  const relatedPages = Array.from({ length: 3 }, (_, pageIndex) =>
    Array.from({ length: 5 }, (_, itemIndex) => relatedPool[(pageIndex * 5 + itemIndex) % relatedPool.length]),
  )
  const related = relatedPages[relatedPage]
  const thumbnails = [nft, nft, nft, nft]

  return (
    <>
      <MobileNftDetails nft={nft} quantity={quantity} setQuantity={setQuantity} buy={() => void handleBuy()} purchase={purchase} isFavorite={isFavorite} toggleFavorite={handleFavorite} canFavorite={isAuthenticated} />

      <div className="mx-auto hidden max-w-[1440px] px-4 pb-14 pt-9 sm:px-6 md:block lg:px-[120px]">
      <div className="font-display text-base font-bold text-foreground">
        <Link to="/" search={homeSearch} className="hover:text-primarySoft">Inicio</Link>
        <span className="px-2 text-[#8f7560]">/</span>
        <span>Mercado</span>
      </div>

      <section className="mt-4 grid gap-8 lg:grid-cols-[604px_1fr]">
        <div className="grid gap-6 sm:grid-cols-[90px_490px]">
          <div className="order-2 flex gap-4 overflow-x-auto sm:order-1 sm:block sm:space-y-4">
            {thumbnails.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                type="button"
                className="size-[90px] shrink-0 overflow-hidden rounded-md border border-transparent bg-[#efe7d2]"
                aria-label={`Miniatura ${index + 1}`}
              >
                <img src={item.hero} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div className="order-1 self-start bg-card p-5 sm:order-2">
            <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[#efe7d2] lg:size-[450px]">
              <img src={nft.hero} alt={`Arte principal do NFT ${nft.title}`} className="h-full w-full object-cover" />
              <button type="button" className="absolute right-0 top-0 grid size-9 place-items-center rounded-full bg-[#2a170f] text-foreground" aria-label="Ampliar imagem">
                <Search size={22} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <div className="border-b border-border pb-3">
            <h1 className="whitespace-nowrap font-display text-3xl font-bold leading-tight text-foreground sm:text-[2rem]">
              {nft.title}
            </h1>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-2xl font-bold text-primarySoft">{formatEth(nft.priceEth)}</p>
              <div className="font-display text-sm font-bold text-[#bca38d]">
              <span className="text-primary">★★★★★</span>
              <span className="ml-2">19 avaliacoes de colecionadores</span>
              </div>
            </div>
          </div>

          <div className="mt-4 max-w-[610px]">
            <h2 className="font-display text-base font-bold">Sobre este NFT:</h2>
            <p className="mt-3 text-base font-bold leading-7 text-[#9b826d]">
              Um colecionavel digital finalizado a mao da colecao Kurio Editions, verificado na {nft.network}, com arte desbloqueavel e acesso para colecionadores.
            </p>

            <h2 className="mt-4 font-display text-base font-bold">Edicao:</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <EditionPill>1/1</EditionPill>
              <EditionPill>1/10</EditionPill>
              <EditionPill active>1/50</EditionPill>
              <EditionPill>Aberta</EditionPill>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-4">
                <button
                  type="button"
                  className="grid size-12 place-items-center rounded-full bg-primary text-[#160b08]"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={22} />
                </button>
                <span className="font-display text-2xl font-bold">{quantity}</span>
                <button
                  type="button"
                  className="grid size-12 place-items-center rounded-full bg-primary text-[#160b08]"
                  onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={22} />
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="min-w-[150px]" onClick={() => void handleBuy()} disabled={remaining < 1 || isUpdating}>
                  Comprar
                </Button>
                <Button
                  variant="secondary"
                  className="min-w-[145px] border-primary text-primarySoft"
                  onClick={handleFavorite}
                  disabled={favoriteMutation.isPending}
                >
                  <Heart size={18} />
                  {isFavorite ? 'Favorito' : 'Favoritar'}
                </Button>
              </div>
            </div>
            <PurchaseStatus purchase={purchase} className="mt-3" />

            <dl className="mt-5 grid gap-3 font-display text-base font-bold text-[#9b826d]">
              <div>ID do token: #0042</div>
              <div>Colecao: Kurio Apes</div>
              <div>Atributos: Oculos, Esmeralda, Raro</div>
            </dl>

            <div className="mt-4 flex items-center gap-2 font-display text-base font-bold">
              <span>Compartilhar este NFT:</span>
              <Linkedin size={17} />
              <Mail size={17} />
              <Twitter size={17} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <div className="flex flex-wrap gap-9 border-b border-border font-display text-lg font-bold">
          <button type="button" className="border-b-2 border-primary pb-3 text-primary">Detalhes do NFT</button>
          <button type="button" className="pb-3 text-[#bca38d]">Avaliacoes de colecionadores (19)</button>
        </div>

        <div className="mt-4 space-y-7 text-base font-bold leading-7 text-[#9b826d]">
          <p>
            {nft.title} e uma obra digital 1/50 finalizada a mao da colecao Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.
          </p>
          <p>
            A propriedade inclui a arte em alta resolucao, lancamentos exclusivos para colecionadores e um registro permanente de procedencia registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundarias, apoiando novos trabalhos e lancamentos da comunidade.
          </p>
          <div>
            <h3 className="font-display text-foreground">Rede:</h3>
            <p>Cunhado na {nft.network} com procedencia imutavel e metadados armazenados no IPFS.</p>
          </div>
          <div>
            <h3 className="font-display text-foreground">Contrato:</h3>
            <p>Direitos autorais do criador: 5% nas vendas secundarias, pagos automaticamente pelos mercados compativeis.</p>
          </div>
          <div>
            <h3 className="font-display text-foreground">Direitos autorais:</h3>
            <p>0x7A42...19E8 - Contrato inteligente ERC-721 verificado.</p>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <h2 className="border-b border-border pb-3 font-display text-xl font-bold text-primarySoft">Mais desta colecao</h2>
        <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-5">
          {related.map((item, index) => (
            <RelatedCard key={`${relatedPage}-${item.id}-${index}`} nft={item} index={relatedPage * 5 + index} />
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {relatedPages.map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              className={
                pageIndex === relatedPage
                  ? 'size-3 rounded-full border border-primary bg-primary'
                  : 'size-3 rounded-full border border-primary bg-primary/20 transition hover:bg-primary/50'
              }
              aria-label={`Mostrar pagina ${pageIndex + 1} da colecao`}
              aria-current={pageIndex === relatedPage ? 'true' : undefined}
              onClick={() => setRelatedPage(pageIndex)}
            />
          ))}
        </div>
      </section>

      <BenefitsSignup />
      </div>
    </>
  )
}

function MobileNftDetails({
  nft,
  quantity,
  setQuantity,
  buy,
  purchase,
  isFavorite,
  toggleFavorite,
  canFavorite,
}: {
  nft: Nft
  quantity: number
  setQuantity: Dispatch<SetStateAction<number>>
  buy: () => void
  purchase: PurchaseState
  isFavorite: boolean
  toggleFavorite: () => void
  canFavorite: boolean
}) {
  return (
    <div className="min-h-screen bg-[#120906] font-mono text-foreground md:hidden">
      <div className="relative px-7 pt-6">
        <Link to="/" search={homeSearch} className="absolute left-7 top-6 z-20 grid size-9 place-items-center rounded-full border border-border bg-card/70 text-primarySoft" aria-label="Voltar">
          <ArrowLeft size={20} />
        </Link>
        <button
          type="button"
          className="absolute right-7 top-6 z-20 grid size-9 place-items-center rounded-full border border-border bg-card/70 text-primarySoft disabled:opacity-50"
          aria-label={canFavorite && isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
          onClick={toggleFavorite}
        >
          <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
        </button>
        <img src={nft.hero} alt={nft.title} className="h-[395px] w-full rounded-[20px] object-cover" />
      </div>

      <section className="-mt-[70px] relative z-10 rounded-t-[24px] bg-card px-6 pb-8 pt-8 shadow-[0_-20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-black tracking-[0.03em]">{nft.title}</h1>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-1 text-xs font-bold">
            <Star size={13} className="fill-primary text-primary" />
            4.8(19)
          </span>
        </div>
        <p className="mt-4 text-sm font-medium leading-7 text-[#d1b38f]">
          Um colecionavel digital 1/50 finalizado a mao da colecao Kurio Editions, verificado na Ethereum.
        </p>

        <h2 className="mt-4 text-sm font-black">Edicao:</h2>
        <div className="mt-2 flex gap-2 text-xs">
          {['1/10', '1/10', '1/50', 'ABERTA'].map((edition, index) => (
            <span key={`${edition}-${index}`} className={edition === '1/50' ? 'rounded-full border border-primary px-2 py-1 text-primarySoft' : 'rounded-full border border-border px-2 py-1 text-[#d1b38f]'}>
              {edition}
            </span>
          ))}
        </div>

        <dl className="mt-4 grid gap-3 text-sm text-[#caa677]">
          <div>ID do token: #0042</div>
          <div>Colecao: Kurio Apes</div>
          <div>Atributos: Oculos, Esmeralda, Raro</div>
        </dl>

        <div className="mt-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#d1b38f]">Qtd.</span>
            <button type="button" className="grid size-7 place-items-center rounded-full bg-primary text-[#120906]" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuir quantidade">
              <Minus size={15} />
            </button>
            <span className="text-base font-black">{quantity}</span>
            <button type="button" className="grid size-7 place-items-center rounded-full bg-primary text-[#120906]" onClick={() => setQuantity((value) => Math.min(purchase.maxQuantity, value + 1))} aria-label="Aumentar quantidade">
              <Plus size={15} />
            </button>
          </div>
          <p className="text-xl font-black text-primarySoft">{nft.priceEth} ETH</p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="button" className="h-[58px] flex-1 rounded-[28px] bg-primary text-sm font-black text-[#120906]" onClick={buy} disabled={purchase.remaining < 1 || purchase.isAdding}>
            Comprar NFT
          </button>
          <button type="button" className="grid size-[58px] place-items-center rounded-full border border-border bg-[#2e1a12] text-[#d1b38f]" onClick={buy} disabled={purchase.remaining < 1 || purchase.isAdding} aria-label="Adicionar ao carrinho">
            <ShoppingCart size={21} className="fill-current" />
          </button>
        </div>
        <PurchaseStatus purchase={purchase} className="mt-3" />
      </section>
    </div>
  )
}
