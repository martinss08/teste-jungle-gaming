import type { Nft, Wallet } from '../types'

import apeEmerald from '../assets/kurio-ape-0.png'
import apeEmeraldDetail from '../assets/kurio-ape-emerald-detail.png'
import apeSage from '../assets/kurio-ape-1.png'
import apeOnyx from '../assets/kurio-ape-2.png'
import apeGolden from '../assets/kurio-ape-3.png'

export const nfts: Nft[] = [
  {
    id: 'emerald-ape-042',
    title: 'Emerald Ape #042',
    creator: 'Nina Roots',
    collection: 'GreenMint Apes',
    rarity: 'lendario',
    priceEth: '3.42',
    previousPriceEth: '3.10',
    available: 2,
    edition: '1 de 1',
    network: 'Ethereum',
    hero: apeEmeraldDetail,
    accent: '#67a36f',
    description:
      'Um avatar raro da colecao GreenMint, criado para financiar reflorestamento e arte digital independente.',
    traits: ['Oculos solares', 'Jaqueta esmeralda', 'Fundo creme', 'Expressao rara'],
  },
  {
    id: 'sage-hood-804',
    title: 'Sage Hood #804',
    creator: 'Mika Stone',
    collection: 'Forest Keepers',
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
  },
  {
    id: 'onyx-visual-232',
    title: 'Onyx Visual #232',
    creator: 'Davi Bram',
    collection: 'Night Grove',
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
  },
  {
    id: 'golden-bark-907',
    title: 'Golden Bark #907',
    creator: 'Lia Grove',
    collection: 'Solar Jungle',
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
  },
  {
    id: 'cocoa-bloom-118',
    title: 'Cocoa Bloom #118',
    creator: 'Ari Flores',
    collection: 'Forest Keepers',
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
  },
]

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

export const categories = ['GreenMint Apes', 'Forest Keepers', 'Solar Jungle', 'Night Grove']
export const rarities = ['todos', 'comum', 'raro', 'epico', 'lendario'] as const
