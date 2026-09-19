import type { Nft, Wallet } from '../types'

import apeEmerald from '../assets/kurio-ape-0.png'
import apeEmeraldDetail from '../assets/kurio-ape-emerald-detail.png'
import apeSage from '../assets/kurio-ape-1.png'
import apeOnyx from '../assets/kurio-ape-2.png'
import apeGolden from '../assets/kurio-ape-3.png'

type NftFixture = Omit<Nft, 'listedAt'>

const baseNfts: NftFixture[] = [
  {
    id: 'emerald-ape-042',
    title: 'Emerald Ape #042',
    creator: 'Nina Roots',
    collection: 'GreenMint Apes',
    category: 'Arte digital',
    rarity: 'lendario',
    priceEth: '3.42',
    previousPriceEth: '3.10',
    available: 2,
    edition: '1 de 3',
    network: 'Ethereum',
    hero: apeEmeraldDetail,
    gallery: [apeEmeraldDetail, apeEmerald],
    accent: '#67a36f',
    description:
      'Um avatar raro da colecao GreenMint, criado para financiar reflorestamento e arte digital independente.',
    traits: ['Oculos solares', 'Jaqueta esmeralda', 'Fundo creme', 'Expressao rara'],
    featured: true,
    tags: ['em-alta'],
  },
  {
    id: 'sage-hood-804',
    title: 'Sage Hood #804',
    creator: 'Mika Stone',
    collection: 'Forest Keepers',
    category: 'Fotografia',
    rarity: 'raro',
    priceEth: '1.65',
    available: 7,
    edition: '3 de 12',
    network: 'Polygon',
    hero: apeSage,
    accent: '#c8d2ae',
    description:
      'Guardiao urbano com moletom botanico e historico de revenda crescente entre colecionadores.',
    traits: ['Capuz verde', 'Tom lavanda', 'Olhar calmo', 'Serie limitada'],
    featured: true,
    tags: ['lancamento'],
  },
  {
    id: 'onyx-visual-232',
    title: 'Onyx Visual #232',
    creator: 'Davi Bram',
    collection: 'Night Grove',
    category: 'Arte 3D',
    rarity: 'epico',
    priceEth: '1.99',
    available: 3,
    edition: '2 de 7',
    network: 'Ethereum',
    hero: apeOnyx,
    accent: '#2f3d35',
    description:
      'Peca de contraste alto, feita para quem busca colecoes com narrativa visual mais sombria.',
    traits: ['Pelo onix', 'Gola natural', 'Fundo claro', 'Expressao intensa'],
    featured: true,
    tags: ['em-alta'],
  },
  {
    id: 'golden-bark-907',
    title: 'Golden Bark #907',
    creator: 'Lia Grove',
    collection: 'Solar Jungle',
    category: 'Musica',
    rarity: 'comum',
    priceEth: '0.96',
    available: 18,
    edition: '8 de 60',
    network: 'Solana',
    hero: apeGolden,
    accent: '#e1a24a',
    description:
      'Arte solar com tracos calorosos, ideal para entrada em colecoes sustentaveis.',
    traits: ['Pele dourada', 'Fones verdes', 'Vibe solar', 'Alta liquidez'],
    tags: ['lancamento'],
  },
  {
    id: 'cocoa-bloom-118',
    title: 'Cocoa Bloom #118',
    creator: 'Ari Flores',
    collection: 'Forest Keepers',
    category: 'Colecionaveis',
    rarity: 'raro',
    priceEth: '2.24',
    available: 5,
    edition: '5 de 15',
    network: 'Ethereum',
    hero: apeEmerald,
    accent: '#835639',
    description:
      'Uma composicao terrosa com detalhes organicos e utilidade em drops de parceiros.',
    traits: ['Tons terrosos', 'Detalhe botanico', 'Edicao media', 'Utilidade futura'],
  },
  {
    id: 'mint-rover-601',
    title: 'Mint Rover #601',
    creator: 'Theo Leaf',
    collection: 'Solar Jungle',
    category: 'Jogos',
    rarity: 'comum',
    priceEth: '0.72',
    available: 24,
    edition: '22 de 90',
    network: 'Polygon',
    hero: apeGolden,
    accent: '#90cc8c',
    description:
      'NFT acessivel com visual leve, pensado para novos colecionadores do ecossistema.',
    traits: ['Verde claro', 'Entrada acessivel', 'Polygon', 'Drop recente'],
    tags: ['lancamento'],
  },
]

const fakeDrops = [
  ['jade-crown-173', 'Jade Crown #173', 'Nina Roots', 'GreenMint Apes', 'epico', '2.88', 4, '4 de 9', 'Ethereum', '#5f9f79', apeEmeraldDetail],
  ['sage-nomad-009', 'Sage Nomad #009', 'Mika Stone', 'Forest Keepers', 'raro', '1.49', 9, '6 de 18', 'Polygon', '#bbc79f', apeSage],
  ['ivory-baron-088', 'Ivory Baron #088', 'Davi Bram', 'Night Grove', 'epico', '2.18', 2, '1 de 8', 'Ethereum', '#d8d2bd', apeOnyx],
  ['golden-beat-207', 'Golden Beat #207', 'Lia Grove', 'Solar Jungle', 'comum', '0.59', 22, '18 de 80', 'Solana', '#e0a85e', apeGolden],
  ['copper-leaf-516', 'Copper Leaf #516', 'Ari Flores', 'Forest Keepers', 'raro', '1.76', 8, '7 de 21', 'Ethereum', '#9d6944', apeEmerald],
  ['mint-signal-814', 'Mint Signal #814', 'Theo Leaf', 'Solar Jungle', 'comum', '0.79', 19, '31 de 90', 'Polygon', '#88bd83', apeGolden],
  ['emerald-pilot-311', 'Emerald Pilot #311', 'Nina Roots', 'GreenMint Apes', 'lendario', '3.95', 1, '1 de 1', 'Ethereum', '#6aaa74', apeEmeraldDetail],
  ['sage-orbit-429', 'Sage Orbit #429', 'Mika Stone', 'Forest Keepers', 'raro', '1.32', 11, '8 de 24', 'Polygon', '#c2caad', apeSage],
  ['onyx-poet-714', 'Onyx Poet #714', 'Davi Bram', 'Night Grove', 'epico', '2.06', 3, '3 de 11', 'Ethereum', '#36443d', apeOnyx],
  ['solar-loop-650', 'Solar Loop #650', 'Lia Grove', 'Solar Jungle', 'comum', '0.84', 25, '27 de 100', 'Solana', '#daa04a', apeGolden],
  ['cocoa-echo-221', 'Cocoa Echo #221', 'Ari Flores', 'Forest Keepers', 'raro', '2.01', 6, '9 de 18', 'Ethereum', '#7d5238', apeEmerald],
  ['mint-drifter-732', 'Mint Drifter #732', 'Theo Leaf', 'Solar Jungle', 'comum', '0.68', 27, '41 de 120', 'Polygon', '#93c88c', apeGolden],
  ['green-hour-504', 'Green Hour #504', 'Nina Roots', 'GreenMint Apes', 'lendario', '3.12', 2, '2 de 4', 'Ethereum', '#70a76d', apeEmeraldDetail],
  ['lavender-sage-095', 'Lavender Sage #095', 'Mika Stone', 'Forest Keepers', 'raro', '1.58', 10, '11 de 30', 'Polygon', '#bfc8ac', apeSage],
  ['midnight-grove-640', 'Midnight Grove #640', 'Davi Bram', 'Night Grove', 'epico', '2.42', 4, '4 de 10', 'Ethereum', '#303f38', apeOnyx],
  ['sunny-bark-288', 'Sunny Bark #288', 'Lia Grove', 'Solar Jungle', 'comum', '0.92', 30, '33 de 120', 'Solana', '#e2a84d', apeGolden],
  ['cocoa-signal-391', 'Cocoa Signal #391', 'Ari Flores', 'Forest Keepers', 'raro', '1.87', 7, '12 de 25', 'Ethereum', '#865b3f', apeEmerald],
  ['mint-circuit-142', 'Mint Circuit #142', 'Theo Leaf', 'Solar Jungle', 'comum', '0.74', 21, '37 de 100', 'Polygon', '#9bd096', apeGolden],
  ['emerald-arc-766', 'Emerald Arc #766', 'Nina Roots', 'GreenMint Apes', 'lendario', '4.20', 1, '1 de 2', 'Ethereum', '#63a66c', apeEmeraldDetail],
  ['forest-scout-557', 'Forest Scout #557', 'Mika Stone', 'Forest Keepers', 'raro', '1.44', 13, '14 de 36', 'Polygon', '#cad3b4', apeSage],
  ['onyx-atelier-319', 'Onyx Atelier #319', 'Davi Bram', 'Night Grove', 'epico', '2.31', 5, '5 de 14', 'Ethereum', '#33423a', apeOnyx],
  ['golden-signal-936', 'Golden Signal #936', 'Lia Grove', 'Solar Jungle', 'comum', '0.63', 28, '44 de 140', 'Solana', '#dda451', apeGolden],
] as const

const categoryByCollection: Record<string, string> = {
  'GreenMint Apes': 'Arte digital',
  'Forest Keepers': 'Fotografia',
  'Night Grove': 'Arte 3D',
  'Solar Jungle': 'Musica',
}

const catalogCategories = [
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

const tagsFor = (index: number): NftFixture['tags'] =>
  index % 4 === 0 ? ['lancamento'] : index % 5 === 1 ? ['em-alta'] : undefined

const fixtures: NftFixture[] = [
  ...baseNfts,
  ...fakeDrops.map(([id, title, creator, collection, rarity, priceEth, available, edition, network, accent, hero], index) => ({
    id,
    title,
    creator,
    collection,
    category: categoryByCollection[collection] ?? 'Colecionaveis',
    rarity,
    priceEth,
    available,
    edition,
    network,
    hero,
    accent,
    description: `Obra da colecao ${collection}, criada como dado fake para demonstrar navegacao, filtros e paginacao do mercado Kurio.`,
    traits: ['Drop curado', 'Mercado Kurio', `Serie ${index + 1}`, 'Dado demonstrativo'],
    tags: tagsFor(index),
  })),
  ...Array.from({ length: 35 }, (_, index) => {
    const source = baseNfts[index % baseNfts.length]
    const issue = index + 1
    return {
      ...source,
      id: `${source.id}-drop-${String(issue).padStart(2, '0')}`,
      title: `${source.collection.split(' ')[0]} Drop #${String(700 + issue).padStart(3, '0')}`,
      category: catalogCategories[index % catalogCategories.length],
      priceEth: (Number(source.priceEth) + (issue % 7) * 0.11).toFixed(2),
      previousPriceEth: issue % 5 === 0 ? (Number(source.priceEth) + 0.36).toFixed(2) : undefined,
      available: Math.max(1, source.available + (issue % 9) - 3),
      edition: `${(issue % 12) + 1} de ${36 + (issue % 5) * 12}`,
      accent: ['#67a36f', '#c8d2ae', '#2f3d35', '#e1a24a', '#835639', '#90cc8c'][index % 6],
      description: `Variacao fake de ${source.collection} para manter a grade do catalogo preenchida durante a paginacao.`,
      traits: ['Grade 3x3', 'Paginacao demo', source.rarity, `Lote ${issue}`],
      featured: false,
      tags: tagsFor(issue + 2),
    }
  }),
]

// Datas de listagem deterministicas (um dia entre cada item) para a ordenacao "recentes".
const newestListing = Date.UTC(2026, 8, 15)
export const nfts: Nft[] = fixtures.map((nft, index) => ({
  ...nft,
  listedAt: new Date(newestListing - index * 86_400_000).toISOString(),
}))

export const wallets: Wallet[] = [
  {
    id: 'wallet-main',
    label: 'Carteira principal',
    address: '0x8A2F4c6e19D0b7a35E1f2C9d4B8a6E0f3c7D49B2',
    network: 'Ethereum',
    status: 'conectada',
    kind: 'principal',
  },
  {
    id: 'wallet-secondary',
    label: 'Carteira secundaria',
    address: '0x3D77b1E9a4c2F06d8B5e3A7c1D9f4E2b6A0c91FA',
    network: 'Polygon',
    status: 'pendente',
    kind: 'secundaria',
  },
]
