import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Home, Search, ShoppingCart, SlidersHorizontal, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { nfts } from '../data/nfts'
import type { Nft } from '../types'
import { formatEth } from '../lib/eth'
import { cn } from '../lib/utils'
import { useCart } from '../modules/cart/useCart'
import { listNfts } from '../modules/catalog/api'
import { useProtectedAction } from '../modules/auth/useProtectedAction'

type HomeSearch = {
  q: string
  rarity: string
  category: string
  minPrice: string
  maxPrice: string
  sort: string
  page: number
}

const categoryLabels = [
  'Arte digital',
  'Fotografia',
  'Musica',
  'Arte 3D',
  'Colecionaveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
]

const blogPosts = [
  ['Como funciona a propriedade de NFTs', 'Aprenda a colecionar, negociar e verificar ativos digitais.'],
  ['10 artistas digitais para acompanhar', 'Conheca criadores que moldam a cultura digital.'],
  ['Raridade, atributos e procedencia', 'Entenda raridade, procedencia, direitos autorais e utilidade.'],
  ['Como proteger sua carteira', 'Proteja sua carteira, seus ativos e sua identidade.'],
]

const sortOptions: Array<{ value: HomeSearch['sort']; label: string }> = [
  { value: 'recentes', label: 'Recentes' },
  { value: 'preco-maior', label: 'Mais caro' },
  { value: 'preco-menor', label: 'Mais barato' },
]

const priceStep = 0.01
const catalogPrices = nfts.map((nft) => Number(nft.priceEth)).filter(Number.isFinite)
const catalogPriceMin = Math.floor(Math.min(...catalogPrices) * 100) / 100
const catalogPriceMax = Math.ceil(Math.max(...catalogPrices) * 100) / 100

function parsePrice(value: string, fallback: number) {
  const cleaned = value.replace(/^"|"$/g, '').replace(',', '.').trim()
  if (!cleaned) return fallback
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clampPrice(value: number) {
  return Math.min(Math.max(value, catalogPriceMin), catalogPriceMax)
}

function formatPrice(value: number) {
  return value.toFixed(2).replace('.', ',')
}

function getInitialPriceRange(search: HomeSearch) {
  const min = clampPrice(parsePrice(search.minPrice, catalogPriceMin))
  const max = clampPrice(parsePrice(search.maxPrice, catalogPriceMax))
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
  }
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const maxVisible = 4
  const start = Math.min(Math.max(1, currentPage - maxVisible + 1), Math.max(1, totalPages - maxVisible + 1))
  const count = Math.min(maxVisible, totalPages)
  return Array.from({ length: count }, (_, index) => start + index)
}

function MarketCard({ nft, index }: { nft: Nft; index: number }) {
  const code = String((index + 1) * 42).padStart(3, '0')

  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="group block">
      <div className="overflow-hidden rounded-sm bg-[#28150f]">
        <div className="aspect-square overflow-hidden bg-[#efe7d2]" style={{ backgroundColor: nft.accent }}>
          <img
            src={nft.hero}
            alt={nft.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>
      <h3 className="mt-3 truncate text-sm font-bold text-[#b39a81]">{nft.title.replace(/#\d+/, `#${code}`)}</h3>
      <p className="font-display text-base font-bold text-primarySoft">
        {formatEth(nft.priceEth)}
        {nft.previousPriceEth && <span className="ml-2 text-sm text-[#7b6554] line-through">{formatEth(nft.previousPriceEth)}</span>}
        {nft.available < 1 && <span className="ml-2 text-xs uppercase text-red-200">Esgotado</span>}
      </p>
    </Link>
  )
}

function PromoTile({ nft, reverse = false }: { nft: Nft; reverse?: boolean }) {
  return (
    <div className="grid min-h-[190px] overflow-hidden rounded-sm bg-card sm:grid-cols-2">
      <div className={reverse ? 'sm:order-2' : ''}>
        <img src={nft.hero} alt={nft.title} className="h-full min-h-[170px] w-full object-cover" loading="lazy" />
      </div>
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <h3 className="max-w-[17rem] font-display text-lg font-bold leading-tight text-foreground">
          {reverse ? 'Arte digital selecionada e muito mais' : 'Lancamentos genesis de edicao limitada'}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#8e7764]">
          {reverse
            ? 'Explore novos artistas, colecoes verificadas e obras digitais que definem a cultura.'
            : 'Colecione edicoes escassas diretamente dos criadores antes da revelacao publica.'}
        </p>
        <Button size="sm" className="mt-4">
          Explorar
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  )
}

function PriceRangeFilter({
  search,
  onSearch,
}: {
  search: HomeSearch
  onSearch: (next: Partial<HomeSearch>) => void
}) {
  const [minValue, setMinValue] = useState(() => getInitialPriceRange(search).min)
  const [maxValue, setMaxValue] = useState(() => getInitialPriceRange(search).max)

  const rangeSize = catalogPriceMax - catalogPriceMin || 1
  const minPercent = ((minValue - catalogPriceMin) / rangeSize) * 100
  const maxPercent = ((maxValue - catalogPriceMin) / rangeSize) * 100

  return (
    <form
      className="mt-5 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch({
          minPrice: minValue.toFixed(2),
          maxPrice: maxValue.toFixed(2),
        })
      }}
    >
      <input type="hidden" name="minPrice" value={minValue.toFixed(2)} />
      <input type="hidden" name="maxPrice" value={maxValue.toFixed(2)} />
      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#7b4a27]" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          aria-label="Preco minimo"
          className="price-range-input"
          min={catalogPriceMin}
          max={catalogPriceMax}
          step={priceStep}
          type="range"
          value={minValue}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), maxValue)
            setMinValue(next)
          }}
        />
        <input
          aria-label="Preco maximo"
          className="price-range-input"
          min={catalogPriceMin}
          max={catalogPriceMax}
          step={priceStep}
          type="range"
          value={maxValue}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), minValue)
            setMaxValue(next)
          }}
        />
      </div>
      <p className="text-xs font-bold text-[#b89c85]">
        Preco: {formatPrice(minValue)} - {formatPrice(maxValue)} ETH
      </p>
      <Button type="submit" size="sm" className="w-fit px-5">
        Aplicar
      </Button>
    </form>
  )
}

export function HomePage() {
  const search = useSearch({ from: '/' }) as HomeSearch
  const navigate = useNavigate({ from: '/' })
  const [sortOpen, setSortOpen] = useState(false)
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['nfts', search],
    queryFn: ({ signal }) => listNfts({
      q: search.q,
      rarity: search.rarity as 'todos',
      category: search.category === 'todos' ? undefined : search.category,
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      sort: search.sort as 'recentes' | 'preco-menor' | 'preco-maior',
      page: search.page,
      pageSize: 9,
    }, signal),
  })
  const featured = nfts[0]
  const apiItems = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const visiblePages = getVisiblePages(search.page, totalPages)
  const categoryCounts = categoryLabels.map((label) => ({
    label,
    count: nfts.filter((nft) => nft.category === label).length,
  }))

  const updateSearch = (next: Partial<HomeSearch>) => {
    navigate({
      search: (old) => ({ ...old, ...next, page: next.page ?? 1 }),
      resetScroll: false,
    })
  }
  const hasActiveFilters =
    Boolean(search.q?.trim()) ||
    (search.category && search.category !== 'todos') ||
    Boolean(search.minPrice) ||
    Boolean(search.maxPrice) ||
    search.sort !== 'recentes'
  const clearFilters = () => {
    setSortOpen(false)
    updateSearch({
      q: '',
      rarity: 'todos',
      category: 'todos',
      minPrice: '',
      maxPrice: '',
      sort: 'recentes',
      page: 1,
    })
  }

  return (
    <>
      <MobileHomePage items={apiItems} isLoading={isLoading} isError={isError} search={search} onSearch={updateSearch} />

      <div className="mx-auto hidden max-w-[1440px] px-4 pb-14 pt-8 sm:px-6 md:block lg:px-[120px]">
      <section className="grid gap-8 lg:min-h-[450px] lg:grid-cols-[600px_450px] lg:items-center lg:justify-between">
        <div className="max-w-[600px]">
          <p className="font-display text-xs font-bold text-[#937966]">Bem-vindo a Kurio</p>
          <h1 className="mt-5 font-display text-4xl font-bold uppercase leading-[1.45] tracking-wide text-[#f4eee6] sm:text-5xl lg:text-[2.75rem]">
            Seja dono do futuro
            <br />
            da arte digital
          </h1>
          <p className="mt-4 max-w-[520px] text-sm font-bold leading-6 text-[#8a705c]">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <a href="#catalogo" className="mt-8 inline-flex">
            <Button size="sm" className="px-7">
              Explorar
            </Button>
          </a>
        </div>

        <div className="justify-self-center lg:justify-self-end">
          <div className="aspect-square w-full max-w-[450px] overflow-hidden rounded-[24px] bg-[#e9e2c9] lg:size-[450px]">
            <img src={featured.hero} alt={featured.title} className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <div className="mt-9 flex justify-center gap-2 lg:pr-[450px]">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-2 rounded-full bg-primary" />
        ))}
      </div>

      <section id="catalogo" className="mt-[50px] grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-[52px]">
        <aside className="space-y-8">
          <div className="bg-card p-5">
            <h2 className="font-display text-base font-bold">Categorias</h2>
            <div className="mt-5 grid gap-4 text-sm font-bold text-[#9a806a]">
              <button
                type="button"
                className={cn(
                  'flex items-center justify-between text-left transition hover:text-primarySoft',
                  (search.category === 'todos' || !search.category) && 'text-primarySoft underline underline-offset-4',
                )}
                aria-pressed={search.category === 'todos' || !search.category}
                onClick={() => updateSearch({ category: 'todos' })}
              >
                <span>Todas</span>
                <span className="text-primarySoft">({nfts.length})</span>
              </button>
              {categoryCounts.map(({ label, count }) => (
                <button
                  key={label}
                  type="button"
                  className={cn(
                    'flex items-center justify-between text-left transition hover:text-primarySoft',
                    search.category === label && 'text-primarySoft underline underline-offset-4',
                  )}
                  aria-pressed={search.category === label}
                  onClick={() => updateSearch({ category: label })}
                >
                  <span>{label}</span>
                  <span className="text-primarySoft">({count})</span>
                </button>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="font-display text-base font-bold">Faixa de preco</h2>
              <PriceRangeFilter key={`${search.minPrice}-${search.maxPrice}`} search={search} onSearch={updateSearch} />
            </div>

            <div className="mt-10">
              <h2 className="font-display text-base font-bold">Rede</h2>
              <div className="mt-5 grid gap-4 text-sm font-bold text-[#9a806a]">
                {['Ethereum', 'Polygon', 'Solana'].map((network, index) => (
                  <button key={network} type="button" className="flex justify-between text-left hover:text-primarySoft">
                    <span>{network}</span>
                    <span>({119 - index * 33})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#1d100b] p-5">
            <p className="font-display text-2xl font-bold uppercase text-primary">NFT em destaque</p>
            <p className="mt-2 font-display text-xl font-bold uppercase text-foreground">Oferta limitada</p>
            <Link to="/nft/$nftId" params={{ nftId: nfts[1].id }} className="mt-5 block overflow-hidden rounded-md bg-[#efe7d2]">
              <img src={nfts[1].hero} alt={nfts[1].title} className="aspect-square w-full object-cover" loading="lazy" />
            </Link>
          </div>
        </aside>

        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-5 font-display text-sm font-bold">
              {[
                ['recentes', 'Todos os NFTs'],
                ['preco-menor', 'Novos lancamentos'],
                ['preco-maior', 'Em alta'],
              ].map(([sort, tab]) => (
                <button
                  key={tab}
                  type="button"
                  className={search.sort === sort ? 'border-b-2 border-primary pb-1 text-primary' : 'pb-1 text-[#a18a78] hover:text-primarySoft'}
                  aria-pressed={search.sort === sort}
                  onClick={() => updateSearch({ sort })}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative self-start sm:self-auto">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#9a806a] hover:text-primarySoft"
                aria-expanded={sortOpen}
                aria-haspopup="menu"
                onClick={() => setSortOpen((value) => !value)}
              >
                <SlidersHorizontal size={16} />
                Ordenar por: {sortOptions.find((option) => option.value === search.sort)?.label ?? 'Recentes'}
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-8 z-20 min-w-44 border border-border bg-card p-2 shadow-[0_18px_45px_rgba(0,0,0,0.35)]" role="menu">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'block w-full px-3 py-2 text-left text-sm font-bold transition hover:bg-[#2a160f] hover:text-primarySoft',
                        search.sort === option.value ? 'text-primary' : 'text-[#a18a78]',
                      )}
                      role="menuitem"
                      onClick={() => {
                        setSortOpen(false)
                        updateSearch({ sort: option.value })
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <form className="mt-5 flex max-w-xl flex-wrap gap-3" onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            updateSearch({ q: String(form.get('q') ?? '') })
          }}>
            <div className="flex min-w-0 flex-1 overflow-hidden rounded-sm border border-border bg-[#160b08]">
              <input
                name="q"
                defaultValue={search.q}
                className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-[#9a806a]"
                placeholder="Buscar por NFT, criador ou colecao"
              />
              <Button type="submit" className="rounded-none">
                <Search size={15} />
                Buscar
              </Button>
            </div>
            {hasActiveFilters && (
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Limpar
              </Button>
            )}
          </form>

          {isError ? (
            <div className="mt-7 bg-card p-8 text-center">
              <h2 className="font-display text-2xl font-bold">Nao foi possivel carregar o catalogo</h2>
              <p className="mt-2 text-sm text-[#9b826d]">Verifique o cenario de rede simulado e tente novamente.</p>
              <Button className="mt-5" onClick={() => void refetch()}>Tentar novamente</Button>
            </div>
          ) : isLoading ? (
            <div className="mt-7 grid gap-x-9 gap-y-14 sm:grid-cols-2 xl:grid-cols-[repeat(3,250px)] xl:justify-between">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="aspect-[0.78] animate-pulse bg-card" />
              ))}
            </div>
          ) : apiItems.length ? (
            <div className="mt-7 grid gap-x-9 gap-y-14 sm:grid-cols-2 xl:grid-cols-[repeat(3,250px)] xl:justify-between">
              {apiItems.map((nft, index) => (
                <MarketCard key={nft.id} nft={nft} index={(search.page - 1) * 9 + index} />
              ))}
            </div>
          ) : (
            <div className="mt-7 bg-card p-8 text-center">
              <h2 className="font-display text-2xl font-bold">Nenhum NFT encontrado</h2>
              <p className="mt-2 text-sm text-[#9b826d]">Ajuste a busca ou remova filtros para ver mais obras.</p>
            </div>
          )}

          <div className="mt-16 flex justify-end gap-2">
            {visiblePages[0] > 1 && (
              <button
                type="button"
                className="grid size-8 place-items-center rounded-sm border border-border text-[#9a806a] transition hover:border-primary hover:text-primarySoft"
                aria-label="Voltar paginas"
                onClick={() => updateSearch({ page: visiblePages[0] - 1 })}
              >
                <ChevronLeft size={15} />
              </button>
            )}
            {visiblePages.map((page) => (
              <button
                key={page}
                type="button"
                className={page === search.page ? 'grid size-8 place-items-center rounded-sm bg-primary text-sm font-bold text-[#160b08]' : 'grid size-8 place-items-center rounded-sm border border-border text-sm font-bold text-[#9a806a]'}
                onClick={() => updateSearch({ page })}
              >
                {page}
              </button>
            ))}
            {visiblePages.at(-1)! < totalPages && (
              <button
                type="button"
                className="grid size-8 place-items-center rounded-sm border border-border text-[#9a806a] transition hover:border-primary hover:text-primarySoft"
                aria-label="Avancar paginas"
                onClick={() => updateSearch({ page: visiblePages.at(-1)! + 1 })}
              >
                <ChevronRight size={15} />
              </button>
            )}
          </div>
          {isFetching && !isLoading && <p className="mt-3 text-right text-xs font-bold text-primarySoft">Atualizando catalogo...</p>}
        </div>
      </section>

      <section className="mt-24 grid gap-7 lg:grid-cols-2">
        <PromoTile nft={nfts[0]} />
        <PromoTile nft={nfts[2]} reverse />
      </section>

      <section className="mt-24">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold">Diario da Cunhagem</h2>
          <p className="mt-3 text-sm font-bold text-[#806957]">Historias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
        </div>

        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {blogPosts.map(([title, description], index) => {
            const nft = nfts[(index + 2) % nfts.length]
            return (
              <article key={title} className="overflow-hidden rounded-sm bg-card">
                <img src={nft.hero} alt="" className="aspect-[1.28] w-full object-cover" loading="lazy" />
                <div className="p-4">
                  <p className="text-[0.68rem] font-bold text-primarySoft">15 de setembro | Leitura de {index + 2} min</p>
                  <h3 className="mt-3 font-display text-base font-bold leading-tight">{title}</h3>
                  <p className="mt-3 text-xs font-bold leading-5 text-[#9b826d]">{description}</p>
                  <a href="#catalogo" className="mt-3 inline-block text-xs font-bold text-primarySoft">
                    Ler mais -&gt;
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </section>

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
      </div>
    </>
  )
}

function MobileHomePage({
  items,
  isLoading,
  isError,
  search,
  onSearch,
}: {
  items: Nft[]
  isLoading: boolean
  isError: boolean
  search: HomeSearch
  onSearch: (next: Partial<HomeSearch>) => void
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSearch({ q: String(form.get('q') ?? '') })
  }


  return (
    <div className="min-h-screen bg-[#120906] px-6 pb-28 pt-10 font-mono text-foreground md:hidden">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <label className="flex h-[46px] min-w-0 flex-1 items-center gap-3 rounded-lg bg-card px-4 text-[#caa677]">
          <Search size={20} />
          <input name="q" defaultValue={search.q} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#caa677]" placeholder="Explorar colecoes" />
        </label>
        <button type="submit" className="grid size-[46px] place-items-center rounded-xl bg-[#d9904b] text-[#120906]" aria-label="Buscar">
          <SlidersHorizontal size={22} />
        </button>
      </form>

      <section className="relative mt-4 overflow-hidden rounded-[24px] bg-[#3a2115] px-4 py-4">
        <div className="relative z-10 max-w-[48%]">
          <p className="text-xs font-black">Bem-vindo a Kurio</p>
          <h1 className="mt-2 text-xl font-black uppercase leading-snug">
            Seja dono da cultura digital
          </h1>
          <p className="mt-3 text-xs leading-5 text-[#c4a27e]">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <a href="#mobile-catalogo" className="mt-2 inline-flex items-center gap-2 text-xs font-black uppercase text-primarySoft">
            Explorar
            <ArrowRight size={14} />
          </a>
        </div>
        <div className="absolute -left-10 top-0 size-44 rounded-full bg-[#7d4b2b]/30" />
        <img src={nfts[0].hero} alt={nfts[0].title} className="absolute right-4 top-3 size-[138px] rounded-[18px] object-cover" />
        <img src={nfts[1].hero} alt={nfts[1].title} className="absolute bottom-8 right-[92px] size-[58px] rounded-[16px] object-cover" />
      </section>

      <div className="mt-3 flex justify-center gap-2">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-2 rounded-full bg-primarySoft" />
        ))}
      </div>

      <nav id="mobile-catalogo" className="mt-5 flex gap-4 overflow-x-auto whitespace-nowrap text-sm" aria-label="Ordenacao do catalogo">
        {[
          ['recentes', 'Todos os NFTs'],
          ['preco-menor', 'Novos lancamentos'],
          ['preco-maior', 'Em alta'],
        ].map(([sort, label]) => (
          <button
            key={sort}
            type="button"
            className={search.sort === sort ? 'border-b-2 border-primary pb-1 font-black text-primarySoft' : 'pb-1 text-foreground'}
            aria-pressed={search.sort === sort}
            onClick={() => onSearch({ sort })}
          >
            {label}
          </button>
        ))}
      </nav>

      {isError ? (
        <div className="mt-8 rounded-2xl bg-card p-5 text-center text-sm text-[#d1b38f]">
          Nao foi possivel carregar o catalogo.
        </div>
      ) : isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-7">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-[0.82] animate-pulse rounded-[20px] bg-card" />
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-7">
        {items.map((nft, index) => (
          <MobileNftCard key={`${nft.id}-${index}`} nft={nft} index={index} />
        ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl bg-card p-5 text-center text-sm text-[#d1b38f]">
          Nenhum NFT encontrado.
        </div>
      )}

      <MobileBottomNav />
    </div>
  )
}

function MobileNftCard({ nft, index }: { nft: Nft; index: number }) {
  const names = ['Emerald Ape #042', 'Sage Nomad #009', 'Ivory Baron #088', 'Golden Beat #207', 'Cocoa Bloom #118', 'Mint Rover #601']
  const runProtected = useProtectedAction()

  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={index % 2 === 1 ? 'mt-8 block' : 'block'}>
      <div className="relative overflow-hidden rounded-[20px] bg-card p-1">
        {index === 2 && <span className="absolute left-0 top-4 z-10 bg-primary px-3 py-2 text-[0.65rem] font-black text-[#120906]">RARO</span>}
        {index === 0 && (
          <button
            type="button"
            className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full border border-primary bg-card/85 text-primarySoft"
            aria-label="Favoritar"
            onClick={(event) => {
              event.preventDefault()
              runProtected(() => undefined)
            }}
          >
            <Heart size={17} />
          </button>
        )}
        <img src={nft.hero} alt={names[index] ?? nft.title} className="aspect-square w-full rounded-[16px] object-cover" />
      </div>
      <h2 className="mt-3 text-sm font-bold">{names[index] ?? nft.title}</h2>
      <p className="text-base font-black text-primarySoft">
        {nft.priceEth} ETH
        {nft.available < 1 && <span className="ml-2 text-xs uppercase text-red-200">Esgotado</span>}
      </p>
    </Link>
  )
}

function MobileBottomNav() {
  const { itemCount } = useCart()
  const runProtected = useProtectedAction()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[94px] max-w-md items-center justify-around rounded-t-[28px] bg-card px-7 text-[#dfb98c] shadow-[0_-18px_50px_rgba(0,0,0,0.3)]">
      <Link to="/" search={{ q: '', rarity: 'todos', category: 'todos', minPrice: '', maxPrice: '', sort: 'recentes', page: 1 }} aria-label="Inicio">
        <Home size={22} className="fill-current" />
      </Link>
      <button type="button" aria-label="Favoritos" onClick={() => runProtected(() => undefined)}>
        <Heart size={22} className="fill-current" />
      </button>
      <button type="button" className="-mt-12 grid size-16 place-items-center rounded-full bg-[#c57d3b] text-white shadow-glow" aria-label="Abrir scanner">
        <span className="grid size-7 place-items-center rounded-lg border-2 border-white" />
      </button>
      <Link to="/carrinho" aria-label="Carrinho" className="relative">
        <ShoppingCart size={22} className="fill-current" />
        {itemCount > 0 && <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-primary text-[0.58rem] text-[#120906]">{itemCount}</span>}
      </Link>
      <Link to="/login" search={{ redirect: '/' }} aria-label="Perfil">
        <UserRound size={22} className="fill-current" />
      </Link>
    </nav>
  )
}
