import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import blogImage1 from '../assets/kurio-ape-1.png'
import blogImage2 from '../assets/kurio-ape-2.png'
import blogImage3 from '../assets/kurio-ape-3.png'
import blogImage4 from '../assets/kurio-ape-0.png'
import { BenefitsSignup } from '../components/BenefitsSignup'
import { Button } from '../components/ui/Button'
import { buttonVariants } from '../components/ui/buttonVariants'
import { Dialog } from '../components/ui/Dialog'
import { Skeleton } from '../components/ui/Skeleton'
import type { CatalogFacetsResponse } from '../contracts/api'
import { formatEth } from '../lib/eth'
import { cn } from '../lib/utils'
import type { Nft } from '../types'
import { getCatalogFacets, listNfts } from '../modules/catalog/api'
import { type CatalogSearch, defaultCatalogSearch, toNftListParams } from '../modules/catalog/search'
import { useFavorites } from '../modules/catalog/useFavorites'

type UpdateSearch = (next: Partial<CatalogSearch>) => void

const pageSize = 9

const rarityLabels: Record<string, string> = {
  comum: 'Comum',
  raro: 'Raro',
  epico: 'Epico',
  lendario: 'Lendario',
}

const catalogTabs = [
  { value: 'todos', label: 'Todos os NFTs' },
  { value: 'lancamento', label: 'Novos lancamentos' },
  { value: 'em-alta', label: 'Em alta' },
]

const sortOptions = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'preco-menor', label: 'Mais barato' },
  { value: 'preco-maior', label: 'Mais caro' },
]

const blogPosts = [
  ['Como funciona a propriedade de NFTs', 'Aprenda a colecionar, negociar e verificar ativos digitais.', blogImage1],
  ['10 artistas digitais para acompanhar', 'Conheca criadores que moldam a cultura digital.', blogImage2],
  ['Raridade, atributos e procedencia', 'Entenda raridade, procedencia, direitos autorais e utilidade.', blogImage3],
  ['Como proteger sua carteira', 'Proteja sua carteira, seus ativos e sua identidade.', blogImage4],
]

const priceStep = 0.01

function parsePrice(value: string, fallback: number) {
  const cleaned = value.replace(/^"|"$/g, '').replace(',', '.').trim()
  if (!cleaned) return fallback
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatPrice(value: number) {
  return value.toFixed(2).replace('.', ',')
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const maxVisible = 4
  const start = Math.min(Math.max(1, currentPage - maxVisible + 1), Math.max(1, totalPages - maxVisible + 1))
  const count = Math.min(maxVisible, totalPages)
  return Array.from({ length: count }, (_, index) => start + index)
}

function countActiveFilters(search: CatalogSearch) {
  return [
    search.q.trim(),
    search.category !== 'todos',
    search.rarity !== 'todos',
    search.network !== 'todos',
    search.tag !== 'todos',
    search.minPrice || search.maxPrice,
    search.sort !== defaultCatalogSearch.sort,
  ].filter(Boolean).length
}

function MarketCard({ nft }: { nft: Nft }) {
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
      <h3 className="mt-3 truncate text-sm font-bold text-[#b39a81]">{nft.title}</h3>
      <p className="font-display text-base font-bold text-primarySoft">
        {formatEth(nft.priceEth)}
        {nft.previousPriceEth && <span className="ml-2 text-sm text-[#7b6554] line-through">{formatEth(nft.previousPriceEth)}</span>}
        {nft.available < 1 && <span className="ml-2 text-xs uppercase text-red-200">Esgotado</span>}
      </p>
    </Link>
  )
}

function PromoTile({ nft, title, description, search, reverse = false }: {
  nft?: Nft
  title: string
  description: string
  search: CatalogSearch
  reverse?: boolean
}) {
  return (
    <div className="grid min-h-[190px] overflow-hidden rounded-sm bg-card sm:grid-cols-2">
      <div className={reverse ? 'sm:order-2' : ''}>
        {nft ? (
          <img src={nft.hero} alt={nft.title} className="aspect-square h-full min-h-[170px] w-full object-cover" loading="lazy" />
        ) : (
          <Skeleton className="aspect-square h-full min-h-[170px] rounded-none" />
        )}
      </div>
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <h3 className="max-w-[17rem] font-display text-lg font-bold leading-tight text-foreground">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#8e7764]">{description}</p>
        <Link to="/" search={search} hash="catalogo" className={buttonVariants({ size: 'sm', className: 'mt-4' })}>
          Explorar
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

function PriceRangeFilter({ search, onSearch, bounds }: {
  search: CatalogSearch
  onSearch: UpdateSearch
  bounds: { min: number; max: number }
}) {
  const clamp = (value: number) => Math.min(Math.max(value, bounds.min), bounds.max)
  const initialMin = clamp(parsePrice(search.minPrice, bounds.min))
  const initialMax = clamp(parsePrice(search.maxPrice, bounds.max))
  const [minValue, setMinValue] = useState(() => Math.min(initialMin, initialMax))
  const [maxValue, setMaxValue] = useState(() => Math.max(initialMin, initialMax))

  const rangeSize = bounds.max - bounds.min || 1
  const minPercent = ((minValue - bounds.min) / rangeSize) * 100
  const maxPercent = ((maxValue - bounds.min) / rangeSize) * 100

  return (
    <form
      className="mt-5 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch({ minPrice: minValue.toFixed(2), maxPrice: maxValue.toFixed(2) })
      }}
    >
      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#7b4a27]" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          aria-label="Preco minimo"
          className="price-range-input"
          min={bounds.min}
          max={bounds.max}
          step={priceStep}
          type="range"
          value={minValue}
          onChange={(event) => setMinValue(Math.min(Number(event.target.value), maxValue))}
        />
        <input
          aria-label="Preco maximo"
          className="price-range-input"
          min={bounds.min}
          max={bounds.max}
          step={priceStep}
          type="range"
          value={maxValue}
          onChange={(event) => setMaxValue(Math.max(Number(event.target.value), minValue))}
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

function FilterOption({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center justify-between text-left transition hover:text-primarySoft',
        active && 'text-primarySoft underline underline-offset-4',
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      <span>{label}</span>
      {count !== undefined && <span className="text-primarySoft">({count})</span>}
    </button>
  )
}

function CatalogFilters({ search, onSearch, facets }: { search: CatalogSearch; onSearch: UpdateSearch; facets?: CatalogFacetsResponse }) {
  if (!facets) {
    return (
      <div className="grid gap-4" aria-busy="true">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-5" />)}
      </div>
    )
  }

  const toggleNetwork = (value: string) => onSearch({ network: search.network === value ? 'todos' : value })
  const bounds = {
    min: Math.floor(Number(facets.priceRange.minEth) * 100) / 100,
    max: Math.ceil(Number(facets.priceRange.maxEth) * 100) / 100,
  }

  return (
    <div className="grid gap-10">
      <div>
        <h2 className="font-display text-base font-bold">Categorias</h2>
        <div className="mt-5 grid gap-4 text-sm font-bold text-[#9a806a]">
          <FilterOption label="Todas" count={facets.total} active={search.category === 'todos'} onClick={() => onSearch({ category: 'todos' })} />
          {facets.categories.map(({ value, count }) => (
            <FilterOption key={value} label={value} count={count} active={search.category === value} onClick={() => onSearch({ category: value })} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-base font-bold">Faixa de preco</h2>
        <PriceRangeFilter key={`${search.minPrice}-${search.maxPrice}`} search={search} onSearch={onSearch} bounds={bounds} />
      </div>

      <div>
        <h2 className="font-display text-base font-bold">Rede</h2>
        <div className="mt-5 grid gap-4 text-sm font-bold text-[#9a806a]">
          {facets.networks.map(({ value, count }) => (
            <FilterOption key={value} label={value} count={count} active={search.network === value} onClick={() => toggleNetwork(value)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function CatalogTabs({ search, onSearch, className, activeClassName, inactiveClassName }: {
  search: CatalogSearch
  onSearch: UpdateSearch
  className: string
  activeClassName: string
  inactiveClassName: string
}) {
  return (
    <div className={className} role="group" aria-label="Colecoes do catalogo">
      {catalogTabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={search.tag === tab.value ? activeClassName : inactiveClassName}
          aria-pressed={search.tag === tab.value}
          onClick={() => onSearch({ tag: tab.value })}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function SortSelect({ id, search, onSearch, className }: { id: string; search: CatalogSearch; onSearch: UpdateSearch; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-sm font-bold text-[#9a806a]', className)}>
      <SlidersHorizontal size={16} aria-hidden="true" />
      <label htmlFor={id}>Ordenar por:</label>
      <select
        id={id}
        value={search.sort}
        onChange={(event) => onSearch({ sort: event.target.value })}
        className="rounded-sm border border-border bg-[#160b08] px-2 py-1 text-[#d1b38f] focus:border-primary"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <nav className="flex justify-end gap-2" aria-label="Paginacao do catalogo">
      {visiblePages[0] > 1 && (
        <button
          type="button"
          className="grid size-8 place-items-center rounded-sm border border-border text-[#9a806a] transition hover:border-primary hover:text-primarySoft"
          aria-label="Voltar paginas"
          onClick={() => onPage(visiblePages[0] - 1)}
        >
          <ChevronLeft size={15} />
        </button>
      )}
      {visiblePages.map((item) => (
        <button
          key={item}
          type="button"
          className={item === page ? 'grid size-8 place-items-center rounded-sm bg-primary text-sm font-bold text-[#160b08]' : 'grid size-8 place-items-center rounded-sm border border-border text-sm font-bold text-[#9a806a]'}
          aria-label={`Pagina ${item}`}
          aria-current={item === page ? 'page' : undefined}
          onClick={() => onPage(item)}
        >
          {item}
        </button>
      ))}
      {visiblePages.at(-1)! < totalPages && (
        <button
          type="button"
          className="grid size-8 place-items-center rounded-sm border border-border text-[#9a806a] transition hover:border-primary hover:text-primarySoft"
          aria-label="Avancar paginas"
          onClick={() => onPage(visiblePages.at(-1)! + 1)}
        >
          <ChevronRight size={15} />
        </button>
      )}
    </nav>
  )
}

function CatalogError({ onRetry, className }: { onRetry: () => void; className: string }) {
  return (
    <div className={className} role="alert">
      <h2 className="font-display text-2xl font-bold">Nao foi possivel carregar o catalogo</h2>
      <p className="mt-2 text-sm text-[#b89c85]">Verifique sua conexao e tente novamente.</p>
      <Button className="mt-5" onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}

function CatalogEmpty({ onClear, className }: { onClear: () => void; className: string }) {
  return (
    <div className={className}>
      <h2 className="font-display text-2xl font-bold">Nenhum NFT encontrado</h2>
      <p className="mt-2 text-sm text-[#b89c85]">Ajuste a busca ou remova filtros para ver mais obras.</p>
      <Button variant="secondary" className="mt-5" onClick={onClear}>Limpar filtros</Button>
    </div>
  )
}

export function HomePage() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const catalogQuery = useQuery({
    queryKey: ['nfts', search],
    queryFn: ({ signal }) => listNfts(toNftListParams(search, pageSize), signal),
  })
  const featuredQuery = useQuery({
    queryKey: ['nfts', 'featured'],
    queryFn: ({ signal }) => listNfts({ featured: true, pageSize: 3 }, signal),
  })
  const facetsQuery = useQuery({ queryKey: ['nft-facets'], queryFn: getCatalogFacets })
  const featured = featuredQuery.data?.items ?? []
  const items = catalogQuery.data?.items ?? []
  const totalPages = catalogQuery.data?.totalPages ?? 1

  const updateSearch: UpdateSearch = (next) => {
    void navigate({
      search: (old) => ({ ...old, ...next, page: next.page ?? 1 }),
      resetScroll: false,
    })
  }
  const clearFilters = () => {
    void navigate({ search: defaultCatalogSearch, resetScroll: false })
  }
  const hasActiveFilters = countActiveFilters(search) > 0
  const retry = () => void catalogQuery.refetch()

  const results = catalogQuery.isError ? (
    <CatalogError onRetry={retry} className="mt-7 bg-card p-8 text-center" />
  ) : catalogQuery.isPending ? (
    <div className="mt-7 grid gap-x-9 gap-y-14 sm:grid-cols-2 xl:grid-cols-[repeat(3,250px)] xl:justify-between" aria-busy="true">
      {Array.from({ length: pageSize }).map((_, index) => (
        <Skeleton key={index} className="aspect-[0.78] rounded-none" />
      ))}
    </div>
  ) : items.length ? (
    <div className="mt-7 grid gap-x-9 gap-y-14 sm:grid-cols-2 xl:grid-cols-[repeat(3,250px)] xl:justify-between">
      {items.map((nft) => (
        <MarketCard key={nft.id} nft={nft} />
      ))}
    </div>
  ) : (
    <CatalogEmpty onClear={clearFilters} className="mt-7 bg-card p-8 text-center" />
  )

  return (
    <>
      <MobileHomePage
        search={search}
        onSearch={updateSearch}
        onClear={clearFilters}
        featured={featured}
        facets={facetsQuery.data}
        items={items}
        isPending={catalogQuery.isPending}
        isError={catalogQuery.isError}
        onRetry={retry}
        totalPages={totalPages}
      />

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
          <a href="#catalogo" className={buttonVariants({ size: 'sm', className: 'mt-8 px-7' })}>
            Explorar
          </a>
        </div>

        <div className="justify-self-center lg:justify-self-end">
          <div className="aspect-square w-full max-w-[450px] overflow-hidden rounded-[24px] bg-[#e9e2c9] lg:size-[450px]">
            {featured[0] ? (
              <Link to="/nft/$nftId" params={{ nftId: featured[0].id }}>
                <img src={featured[0].hero} alt={featured[0].title} className="h-full w-full object-cover" />
              </Link>
            ) : (
              <Skeleton className="h-full w-full rounded-none" />
            )}
          </div>
        </div>
      </section>

      <div className="mt-9 flex justify-center gap-2 lg:pr-[450px]" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-2 rounded-full bg-primary" />
        ))}
      </div>

      <section id="catalogo" className="mt-[50px] grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-[52px]">
        <aside className="space-y-8" aria-label="Filtros do catalogo">
          <div className="bg-card p-5">
            <CatalogFilters search={search} onSearch={updateSearch} facets={facetsQuery.data} />
          </div>

          <div className="bg-[#1d100b] p-5">
            <p className="font-display text-2xl font-bold uppercase text-primary">NFT em destaque</p>
            <p className="mt-2 font-display text-xl font-bold uppercase text-foreground">Oferta limitada</p>
            {featured[1] ? (
              <Link to="/nft/$nftId" params={{ nftId: featured[1].id }} className="mt-5 block overflow-hidden rounded-md bg-[#efe7d2]">
                <img src={featured[1].hero} alt={featured[1].title} className="aspect-square w-full object-cover" loading="lazy" />
              </Link>
            ) : (
              <Skeleton className="mt-5 aspect-square w-full" />
            )}
          </div>
        </aside>

        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CatalogTabs
              search={search}
              onSearch={updateSearch}
              className="flex flex-wrap gap-5 font-display text-sm font-bold"
              activeClassName="border-b-2 border-primary pb-1 text-primary"
              inactiveClassName="pb-1 text-[#a18a78] hover:text-primarySoft"
            />
            <SortSelect id="catalog-sort" search={search} onSearch={updateSearch} className="self-start sm:self-auto" />
          </div>
          {hasActiveFilters && (
            <div className="mt-5">
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}

          {results}

          <div className="mt-16">
            <Pagination page={search.page} totalPages={totalPages} onPage={(page) => updateSearch({ page })} />
          </div>
          {catalogQuery.isFetching && !catalogQuery.isPending && (
            <p className="mt-3 text-right text-xs font-bold text-primarySoft" role="status">Atualizando catalogo...</p>
          )}
        </div>
      </section>

      <section className="mt-24 grid gap-7 lg:grid-cols-2">
        <PromoTile
          nft={featured[0]}
          title="Lancamentos genesis de edicao limitada"
          description="Colecione edicoes escassas diretamente dos criadores antes da revelacao publica."
          search={{ ...defaultCatalogSearch, tag: 'lancamento' }}
        />
        <PromoTile
          nft={featured[2]}
          title="Arte digital selecionada e muito mais"
          description="Explore novos artistas, colecoes verificadas e obras digitais que definem a cultura."
          search={{ ...defaultCatalogSearch, category: 'Arte digital' }}
          reverse
        />
      </section>

      <section className="mt-24">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold">Diario da Cunhagem</h2>
          <p className="mt-3 text-sm font-bold text-[#806957]">Historias, guias e insights para colecionadores sobre o universo da propriedade digital.</p>
        </div>

        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {blogPosts.map(([title, description, image], index) => (
            <article key={title} className="overflow-hidden rounded-sm bg-card">
              <img src={image} alt="" className="aspect-[1.28] w-full object-cover" loading="lazy" />
              <div className="p-4">
                <p className="text-[0.68rem] font-bold text-primarySoft">15 de setembro | Leitura de {index + 2} min</p>
                <h3 className="mt-3 font-display text-base font-bold leading-tight">{title}</h3>
                <p className="mt-3 text-xs font-bold leading-5 text-[#b89c85]">{description}</p>
                <p className="mt-3 text-xs font-bold text-[#806957]">Artigo em breve</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BenefitsSignup />
      </div>
    </>
  )
}

function MobileHomePage({
  search,
  onSearch,
  onClear,
  featured,
  facets,
  items,
  isPending,
  isError,
  onRetry,
  totalPages,
}: {
  search: CatalogSearch
  onSearch: UpdateSearch
  onClear: () => void
  featured: Nft[]
  facets?: CatalogFacetsResponse
  items: Nft[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
  totalPages: number
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const favorites = useFavorites()
  const activeFilters = countActiveFilters(search)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSearch({ q: String(form.get('q') ?? '') })
  }

  return (
    <div className="min-h-screen bg-[#120906] px-6 pb-10 pt-10 font-mono text-foreground md:hidden">
      <div className="flex gap-2">
        <form className="min-w-0 flex-1" role="search" onSubmit={handleSubmit}>
          <label className="flex h-[46px] min-w-0 items-center gap-3 rounded-lg bg-card px-4 text-[#caa677]">
            <Search size={20} aria-hidden="true" />
            <span className="sr-only">Buscar NFTs</span>
            <input id="busca" key={search.q} name="q" type="search" defaultValue={search.q} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#caa677]" placeholder="Explorar colecoes" />
          </label>
        </form>
        <button
          type="button"
          className="relative grid size-[46px] place-items-center rounded-xl bg-[#d9904b] text-[#120906]"
          aria-label={activeFilters ? `Filtros (${activeFilters} ativos)` : 'Filtros'}
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={22} />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-foreground text-[0.62rem] font-black text-[#120906]" aria-hidden="true">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

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
        {featured[0] ? (
          <img src={featured[0].hero} alt={featured[0].title} className="absolute right-4 top-3 size-[138px] rounded-[18px] object-cover" />
        ) : (
          <Skeleton className="absolute right-4 top-3 size-[138px] rounded-[18px]" />
        )}
        {featured[1] && (
          <img src={featured[1].hero} alt={featured[1].title} className="absolute bottom-8 right-[92px] size-[58px] rounded-[16px] object-cover" />
        )}
      </section>

      <div className="mt-3 flex justify-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-2 rounded-full bg-primarySoft" />
        ))}
      </div>

      <div id="mobile-catalogo">
        <CatalogTabs
          search={search}
          onSearch={onSearch}
          className="mt-5 flex gap-4 overflow-x-auto whitespace-nowrap text-sm"
          activeClassName="border-b-2 border-primary pb-1 font-black text-primarySoft"
          inactiveClassName="pb-1 text-foreground"
        />
      </div>

      {favorites.error && <p role="alert" className="mt-4 rounded-xl bg-red-950/40 p-3 text-xs text-red-100">{favorites.error}</p>}

      {isError ? (
        <CatalogError onRetry={onRetry} className="mt-8 rounded-2xl bg-card p-5 text-center" />
      ) : isPending ? (
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-7" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[0.82] rounded-[20px]" />
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-4 grid min-h-[1380px] grid-cols-2 gap-x-5 gap-y-7">
          {items.map((nft, index) => (
            <MobileNftCard
              key={nft.id}
              nft={nft}
              staggered={index % 2 === 1}
              priority={index < 4}
              isFavorite={favorites.isFavorite(nft.id)}
              isFavoritePending={favorites.isPending(nft.id)}
              onToggleFavorite={() => favorites.toggleFavorite(nft.id)}
            />
          ))}
        </div>
      ) : (
        <CatalogEmpty onClear={onClear} className="mt-8 rounded-2xl bg-card p-5 text-center" />
      )}

      <div className="mt-8">
        <Pagination page={search.page} totalPages={totalPages} onPage={(page) => onSearch({ page })} />
      </div>

      <section className="mt-12 grid gap-5" aria-label="Mais formas de explorar">
        {[
          {
            nft: featured[0],
            title: 'Lancamentos genesis',
            description: 'Edicoes escassas direto dos criadores.',
            search: { ...defaultCatalogSearch, tag: 'lancamento' },
          },
          {
            nft: featured[2],
            title: 'Arte digital selecionada',
            description: 'Colecoes verificadas e obras em destaque.',
            search: { ...defaultCatalogSearch, category: 'Arte digital' },
          },
        ].map((item) => (
          <Link key={item.title} to="/" search={item.search} hash="catalogo" className="grid grid-cols-[92px_1fr] gap-4 rounded-[18px] bg-card p-3">
            {item.nft ? (
              <img src={item.nft.hero} alt={item.nft.title} className="aspect-square rounded-[14px] object-cover" loading="lazy" />
            ) : (
              <Skeleton className="aspect-square rounded-[14px]" />
            )}
            <div className="min-w-0">
              <h3 className="font-display text-sm font-black leading-tight">{item.title}</h3>
              <p className="mt-2 text-xs font-bold leading-5 text-[#b89c85]">{item.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase text-primarySoft">
                Explorar
                <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl font-black text-primarySoft">Diario da Cunhagem</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-[#b89c85]">
          Guias rapidos para colecionar, proteger sua carteira e acompanhar novos criadores.
        </p>
        <div className="mt-5 grid gap-4">
          {blogPosts.slice(0, 3).map(([title, description, image]) => (
            <article key={title} className="grid grid-cols-[92px_1fr] gap-4 rounded-[18px] bg-card p-3">
              <img src={image} alt="" className="aspect-square rounded-[14px] object-cover" loading="lazy" />
              <div>
                <h3 className="font-display text-sm font-black leading-tight">{title}</h3>
                <p className="mt-2 text-xs font-bold leading-5 text-[#b89c85]">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BenefitsSignup />

      {filtersOpen && (
        <Dialog labelledBy="mobile-filters-title" placement="bottom" onClose={() => setFiltersOpen(false)} className="max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] bg-card px-6 pb-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 id="mobile-filters-title" className="text-lg font-black">Filtrar catalogo</h2>
            <button type="button" className="grid size-9 place-items-center rounded-full border border-border text-primarySoft" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <SortSelect id="mobile-catalog-sort" search={search} onSearch={onSearch} className="mt-6" />
          <div className="mt-8">
            <CatalogFilters search={search} onSearch={onSearch} facets={facets} />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onClear} disabled={!activeFilters}>Limpar</Button>
            <Button onClick={() => setFiltersOpen(false)}>Ver resultados</Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function MobileNftCard({ nft, staggered, priority = false, isFavorite, isFavoritePending, onToggleFavorite }: {
  nft: Nft
  staggered: boolean
  priority?: boolean
  isFavorite: boolean
  isFavoritePending: boolean
  onToggleFavorite: () => void
}) {
  return (
    <article className={cn('relative', staggered && 'mt-8')}>
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block">
        <div className="relative overflow-hidden rounded-[20px] bg-card p-1">
          {nft.rarity !== 'comum' && (
            <span className="absolute left-0 top-4 z-10 bg-primary px-3 py-2 text-[0.65rem] font-black uppercase text-[#120906]">
              {rarityLabels[nft.rarity]}
            </span>
          )}
          <img
            src={nft.hero}
            alt={nft.title}
            className="aspect-square w-full rounded-[16px] object-cover"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        </div>
        <h2 className="mt-3 truncate text-sm font-bold">{nft.title}</h2>
        <p className="text-base font-black text-primarySoft">
          {formatEth(nft.priceEth)}
          {nft.available < 1 && <span className="ml-2 text-xs uppercase text-red-200">Esgotado</span>}
        </p>
      </Link>
      <button
        type="button"
        className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full border border-primary bg-card/85 text-primarySoft disabled:opacity-60"
        aria-label={isFavorite ? `Remover ${nft.title} dos favoritos` : `Favoritar ${nft.title}`}
        aria-pressed={isFavorite}
        disabled={isFavoritePending}
        onClick={onToggleFavorite}
      >
        <Heart size={17} className={isFavorite ? 'fill-current' : ''} />
      </button>
    </article>
  )
}
