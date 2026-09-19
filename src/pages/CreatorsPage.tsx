import { Link } from '@tanstack/react-router'
import { ArrowRight, Layers, Sparkles } from 'lucide-react'
import { nfts } from '../data/nfts'
import { defaultCatalogSearch } from '../modules/catalog/search'

const creatorStories: Record<string, string> = {
  'Nina Roots': 'Avatares digitais com renda destinada a narrativas de impacto ambiental.',
  'Mika Stone': 'Fotografia e personagens urbanos com tons botanicos e series limitadas.',
  'Davi Bram': 'Arte 3D de contraste alto, criada para colecionadores de atmosfera sombria.',
  'Lia Grove': 'Colecoes solares e musicais para entrada acessivel no universo Kurio.',
  'Ari Flores': 'Composicoes organicas com foco em utilidade e drops de parceiros.',
  'Theo Leaf': 'NFTs leves, acessiveis e pensados para novos colecionadores.',
}

const creators = Object.values(
  nfts.reduce<Record<string, {
    name: string
    collection: string
    count: number
    hero: string
    minPrice: number
    categories: Set<string>
  }>>((acc, nft) => {
    acc[nft.creator] ??= {
      name: nft.creator,
      collection: nft.collection,
      count: 0,
      hero: nft.hero,
      minPrice: Number(nft.priceEth),
      categories: new Set<string>(),
    }
    acc[nft.creator].count += 1
    acc[nft.creator].minPrice = Math.min(acc[nft.creator].minPrice, Number(nft.priceEth))
    acc[nft.creator].categories.add(nft.category)
    return acc
  }, {}),
).sort((a, b) => b.count - a.count)

export function CreatorsPage() {
  const featured = creators[0]

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-8 font-mono sm:px-6 lg:px-[120px]">
      <section className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primarySoft">Criadores</span>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Descubra artistas e colecoes</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#caa677]">
            Explore criadores por estilo, colecao e faixa de preco. Cada card leva direto ao mercado filtrado pelo nome do artista.
          </p>
        </div>
        {featured && (
          <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 bg-card p-5">
            <img src={featured.hero} alt="" className="size-24 rounded-md bg-[#efe7d2] object-cover" />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primarySoft">
                <Sparkles size={14} />
                Em destaque
              </p>
              <h2 className="mt-2 truncate font-display text-xl font-bold">{featured.name}</h2>
              <p className="mt-1 text-sm text-foreground/60">{featured.collection}</p>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Lista de criadores">
        {creators.map((creator) => (
          <article key={creator.name} className="min-w-0 bg-card p-5">
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-[#efe7d2]">
              <img src={creator.hero} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <h2 className="mt-4 truncate font-display text-xl font-bold">{creator.name}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-foreground/60">
              {creatorStories[creator.name] ?? `Criador da colecao ${creator.collection}.`}
            </p>
            <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[#caa677]">Colecao principal</dt>
                <dd className="text-right font-bold">{creator.collection}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#caa677]">NFTs publicados</dt>
                <dd className="text-right font-bold">{creator.count}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#caa677]">A partir de</dt>
                <dd className="text-right font-bold">{creator.minPrice.toFixed(2)} ETH</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(creator.categories).slice(0, 3).map((category) => (
                <span key={category} className="rounded-full border border-primary/40 px-2.5 py-1 text-xs font-bold text-primarySoft">
                  {category}
                </span>
              ))}
            </div>
            <Link
              to="/"
              search={{ ...defaultCatalogSearch, q: creator.name }}
              hash="catalogo"
              className="mt-5 inline-flex items-center gap-2 font-display text-sm font-bold text-primarySoft hover:text-primary"
            >
              Ver NFTs
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-10 bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Layers size={20} className="text-primarySoft" />
          Como escolhemos destaques
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/60">
          Priorizamos colecoes com disponibilidade, historico de drops e diversidade de categorias para ajudar novos compradores a comparar estilos antes de finalizar uma compra.
        </p>
      </section>
    </div>
  )
}
