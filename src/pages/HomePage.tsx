import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronRight, Heart, Home, Search, ShoppingCart, SlidersHorizontal, UserRound } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { categories, nfts } from '../data/nfts'
import type { Nft } from '../types'
import { formatEth } from '../lib/utils'
import { useCart } from '../modules/cart/useCart'

type HomeSearch = {
  q: string
  rarity: string
  sort: string
  page: number
}

const collectionCounts = [33, 12, 65, 39, 23, 17, 19, 13, 18]
const collectionLabels = [
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

function filterNfts(search: HomeSearch): Nft[] {
  const query = search.q.toLowerCase().trim()
  const result = nfts.filter((nft) => {
    const matchesQuery =
      !query ||
      nft.title.toLowerCase().includes(query) ||
      nft.creator.toLowerCase().includes(query) ||
      nft.collection.toLowerCase().includes(query)
    const matchesRarity = search.rarity === 'todos' || nft.rarity === search.rarity
    return matchesQuery && matchesRarity
  })

  return result.sort((a, b) => {
    if (search.sort === 'preco-menor') return Number(a.priceEth) - Number(b.priceEth)
    if (search.sort === 'preco-maior') return Number(b.priceEth) - Number(a.priceEth)
    return a.title.localeCompare(b.title)
  })
}

function repeatNfts(items: Nft[], minLength = 9) {
  return Array.from({ length: minLength }, (_, index) => items[index % items.length])
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
        {formatEth((Number(nft.priceEth) * (0.58 + index * 0.035)).toFixed(2))}
        {index === 2 && <span className="ml-2 text-sm text-[#7b6554] line-through">2.29 ETH</span>}
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

export function HomePage() {
  const search = useSearch({ from: '/' }) as HomeSearch
  const navigate = useNavigate({ from: '/' })
  const { data = [], isLoading } = useQuery({
    queryKey: ['nfts', search],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 140))
      return filterNfts(search)
    },
  })
  const featured = nfts[0]
  const marketItems = repeatNfts(data.length ? data : nfts)

  const updateSearch = (next: Partial<HomeSearch>) => {
    navigate({
      search: (old) => ({ ...old, ...next, page: next.page ?? 1 }),
    })
  }

  return (
    <>
      <MobileHomePage />

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
            <h2 className="font-display text-base font-bold">Colecoes</h2>
            <div className="mt-5 grid gap-4 text-sm font-bold text-[#9a806a]">
              {collectionLabels.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className="flex items-center justify-between text-left transition hover:text-primarySoft"
                  onClick={() => updateSearch({ q: categories[index % categories.length] })}
                >
                  <span>{label}</span>
                  <span className="text-primarySoft">({collectionCounts[index]})</span>
                </button>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="font-display text-base font-bold">Faixa de preco</h2>
              <div className="mt-5 flex items-center gap-3">
                <span className="size-4 rounded-full bg-primary" />
                <span className="h-1 flex-1 rounded-full bg-primary" />
                <span className="size-4 rounded-full bg-primary" />
                <span className="h-1 flex-1 rounded-full bg-[#76523a]" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#9a806a]">Preco: 0,02 - 12,30 ETH</p>
              <Button size="sm" className="mt-3">
                Aplicar
              </Button>
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
              {['Todos os NFTs', 'Novos lancamentos', 'Em alta'].map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={index === 0 ? 'border-b-2 border-primary pb-1 text-primary' : 'pb-1 text-[#a18a78] hover:text-primarySoft'}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 self-start text-sm font-bold text-[#9a806a] hover:text-primarySoft sm:self-auto"
              onClick={() => updateSearch({ sort: search.sort === 'preco-maior' ? 'recentes' : 'preco-maior' })}
            >
              <SlidersHorizontal size={16} />
              Ordenar por: Listados recentemente
            </button>
          </div>

          {isLoading ? (
            <div className="mt-7 grid gap-x-9 gap-y-14 sm:grid-cols-2 xl:grid-cols-[repeat(3,250px)] xl:justify-between">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="aspect-[0.78] animate-pulse bg-card" />
              ))}
            </div>
          ) : (
            <div className="mt-7 grid gap-x-9 gap-y-14 sm:grid-cols-2 xl:grid-cols-[repeat(3,250px)] xl:justify-between">
              {marketItems.map((nft, index) => (
                <MarketCard key={`${nft.id}-${index}`} nft={nft} index={index} />
              ))}
            </div>
          )}

          <div className="mt-16 flex justify-end gap-2">
            {[1, 2, 3, 4].map((page) => (
              <button
                key={page}
                type="button"
                className={page === 1 ? 'grid size-8 place-items-center rounded-sm bg-primary text-sm font-bold text-[#160b08]' : 'grid size-8 place-items-center rounded-sm border border-border text-sm font-bold text-[#9a806a]'}
              >
                {page}
              </button>
            ))}
            <button type="button" className="grid size-8 place-items-center rounded-sm border border-border text-[#9a806a]">
              <ChevronRight size={15} />
            </button>
          </div>
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

function MobileHomePage() {
  const items = [nfts[0], nfts[1], nfts[2], nfts[3], nfts[4], nfts[5]]

  return (
    <div className="min-h-screen bg-[#120906] px-6 pb-28 pt-10 font-mono text-foreground md:hidden">
      <div className="flex gap-2">
        <label className="flex h-[46px] min-w-0 flex-1 items-center gap-3 rounded-lg bg-card px-4 text-[#caa677]">
          <Search size={20} />
          <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#caa677]" placeholder="Explorar colecoes" />
        </label>
        <button type="button" className="grid size-[46px] place-items-center rounded-xl bg-[#d9904b] text-[#120906]" aria-label="Filtros">
          <SlidersHorizontal size={22} />
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
        <img src={nfts[0].hero} alt={nfts[0].title} className="absolute right-4 top-3 size-[138px] rounded-[18px] object-cover" />
        <img src={nfts[1].hero} alt={nfts[1].title} className="absolute bottom-8 right-[92px] size-[58px] rounded-[16px] object-cover" />
      </section>

      <div className="mt-3 flex justify-center gap-2">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="size-2 rounded-full bg-primarySoft" />
        ))}
      </div>

      <nav id="mobile-catalogo" className="mt-5 flex gap-4 overflow-x-auto whitespace-nowrap text-sm">
        <button type="button" className="border-b-2 border-primary pb-1 font-black text-primarySoft">
          Todos os NFTs
        </button>
        <button type="button" className="pb-1 text-foreground">Novos lancamentos</button>
        <button type="button" className="pb-1 text-foreground">Em alta</button>
      </nav>

      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-7">
        {items.map((nft, index) => (
          <MobileNftCard key={`${nft.id}-${index}`} nft={nft} index={index} />
        ))}
      </div>

      <MobileBottomNav />
    </div>
  )
}

function MobileNftCard({ nft, index }: { nft: Nft; index: number }) {
  const names = ['Emerald Ape #042', 'Sage Nomad #009', 'Ivory Baron #088', 'Golden Beat #207', 'Cocoa Bloom #118', 'Mint Rover #601']
  const prices = ['1.19', '1.69', '2.12', '1.98', '2.24', '0.72']

  return (
    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={index % 2 === 1 ? 'mt-8 block' : 'block'}>
      <div className="relative overflow-hidden rounded-[20px] bg-card p-1">
        {index === 2 && <span className="absolute left-0 top-4 z-10 bg-primary px-3 py-2 text-[0.65rem] font-black text-[#120906]">RARO</span>}
        {index === 0 && (
          <button type="button" className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full border border-primary bg-card/85 text-primarySoft" aria-label="Favoritar">
            <Heart size={17} />
          </button>
        )}
        <img src={nft.hero} alt={names[index] ?? nft.title} className="aspect-square w-full rounded-[16px] object-cover" />
      </div>
      <h2 className="mt-3 text-sm font-bold">{names[index] ?? nft.title}</h2>
      <p className="text-base font-black text-primarySoft">{prices[index] ?? nft.priceEth} ETH</p>
    </Link>
  )
}

function MobileBottomNav() {
  const { itemCount } = useCart()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[94px] max-w-md items-center justify-around rounded-t-[28px] bg-card px-7 text-[#dfb98c] shadow-[0_-18px_50px_rgba(0,0,0,0.3)]">
      <Link to="/" search={{ q: '', rarity: 'todos', sort: 'recentes', page: 1 }} aria-label="Inicio">
        <Home size={22} className="fill-current" />
      </Link>
      <button type="button" aria-label="Favoritos">
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
