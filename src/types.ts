export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario'

export type Nft = {
  id: string
  title: string
  creator: string
  collection: string
  category: string
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
  // Versao do recurso na API; eventos em tempo real so sao aplicados se forem mais novos.
  version?: number
}

export type CartLine = {
  nftId: string
  quantity: number
}

export type WalletKind = 'principal' | 'secundaria'

export type Wallet = {
  id: string
  label: string
  address: string
  network: string
  status: 'conectada' | 'pendente'
  // Cada usuario tem exatamente uma carteira principal.
  kind: WalletKind
}
