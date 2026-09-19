export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario'

export type Nft = {
  id: string
  title: string
  creator: string
  collection: string
  rarity: Rarity
  priceEth: string
  previousPriceEth?: string
  available: number
  edition: string
  network: string
  hero: string
  accent: string
  description: string
  traits: string[]
}

export type CartLine = {
  nftId: string
  quantity: number
}

export type Wallet = {
  id: string
  label: string
  address: string
  network: string
  status: 'conectada' | 'pendente'
}
