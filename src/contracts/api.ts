import type { CartLine, Nft, Rarity, Wallet } from '../types'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EXPIRED_SESSION'
  | 'NETWORK_UNAVAILABLE'
  | 'TRANSIENT_FAILURE'
  | 'IDEMPOTENCY_CONFLICT'
  | 'QUOTE_CHANGED'
  | 'WALLET_REJECTED'

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode
    message: string
    fields?: Record<string, string>
  }
}

export type ApiPage<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type SessionUser = {
  id: string
  name: string
  email: string
}

export type SessionResponse = {
  token: string
  user: SessionUser
  expiresAt: string
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type NftListParams = {
  q?: string
  rarity?: Rarity | 'todos'
  collection?: string
  network?: string
  sort?: 'recentes' | 'preco-menor' | 'preco-maior'
  page?: number
  pageSize?: number
}

export type NftListResponse = ApiPage<Nft>

export type FavoriteResponse = {
  nftIds: string[]
}

export type CartItem = CartLine & {
  // Preco unitario que o usuario viu por ultimo; usado para sinalizar alteracao de preco.
  quotedUnitPriceEth?: string
}

export type CartResponse = {
  items: CartItem[]
  couponCode?: string
  updatedAt: string
}

export type AddCartItemRequest = {
  nftId: string
  quantity: number
}

export type UpdateCartItemRequest = {
  quantity: number
}

export type ApplyCouponRequest = {
  code: string
}

export type QuoteLineIssue = 'preco-alterado' | 'disponibilidade-insuficiente' | 'esgotado'

export type QuoteLine = {
  nftId: string
  title: string
  edition: string
  imageUrl: string
  quantity: number
  unitPriceEth: string
  previousUnitPriceEth?: string
  subtotalEth: string
  available: number
  issues: QuoteLineIssue[]
}

export type QuoteResponse = {
  lines: QuoteLine[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  couponCode?: string
  quoteVersion: number
  expiresAt: string
  stale: boolean
}

export const SUPPORTED_NETWORKS = ['Ethereum', 'Polygon', 'Base'] as const

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase'

export type ConnectWalletRequest = {
  walletId: string
  network: string
  provider: WalletProvider
}

export type WalletConnection = {
  connectionId: string
  walletId: string
  address: string
  network: string
  provider: WalletProvider
  connectedAt: string
}

export type OrderStatus = 'pendente' | 'confirmado' | 'recusado'

export type OrderReceiptItem = {
  nftId: string
  title: string
  edition: string
  imageUrl: string
  quantity: number
  unitPriceEth: string
  subtotalEth: string
}

export type CollectorDetails = {
  displayName: string
  username: string
  email: string
  note?: string
}

// Recibo: snapshot imutavel gerado na criacao do pedido; nao muda se o catalogo mudar.
export type Order = {
  id: string
  // Incrementada a cada mudanca de status; usada para descartar eventos/respostas antigos.
  version: number
  status: OrderStatus
  transaction: string
  explorerUrl: string
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  couponCode?: string
  quoteVersion: number
  network: string
  provider: WalletProvider
  wallet: {
    id: string
    label: string
    address: string
  }
  collector: CollectorDetails
  items: OrderReceiptItem[]
  createdAt: string
  updatedAt: string
}

export type CreateOrderRequest = {
  idempotencyKey: string
  quoteVersion: number
  // Total revisado pelo usuario; o servidor recusa (QUOTE_CHANGED) se a cotacao atual divergir.
  expectedTotalEth: string
  walletId: string
  network: string
  provider: WalletProvider
  collector: CollectorDetails
}

export type Profile = {
  userId: string
  name: string
  email: string
  username: string
  bio: string
  avatarUrl: string
}

export type UpdateProfileRequest = Partial<Pick<Profile, 'name' | 'email' | 'username' | 'bio'>>

// Upload simulado: a imagem ja redimensionada no cliente trafega como data URL.
export type UpdateAvatarRequest = {
  dataUrl: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type WalletRequest = Omit<Wallet, 'id' | 'status'>

export type WalletListResponse = {
  items: Wallet[]
}

// Tempo real (Socket.IO). Todo evento tem identidade estavel (`id`, para descartar duplicatas),
// o recurso afetado e a versao do recurso (para descartar eventos antigos).
export type RealtimeResource = { type: 'nft' | 'order'; id: string }

export type RealtimeEvent<TType extends string, TData> = {
  id: string
  type: TType
  resource: RealtimeResource
  version: number
  occurredAt: string
  // Usuario destinatario; ausente em eventos publicos (ex.: catalogo).
  audience?: string
  data: TData
}

export type NftUpdatedData = Pick<Nft, 'id' | 'priceEth' | 'previousPriceEth' | 'available'>
export type NftUpdatedEvent = RealtimeEvent<'nft.updated', NftUpdatedData>
export type OrderUpdatedEvent = RealtimeEvent<'order.updated', Order>

export type ServerToClientEvents = {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
}

export type MockNftChange = {
  priceEth?: string
  available?: number
}

export type MockScenario = {
  latencyMs: number
  jitterMs: number
  failNext: boolean
  forceSessionExpired: boolean
  paymentResult: 'confirmado' | 'recusado' | 'pendente'
  // Tempo ate o pagamento pendente ser liquidado com `paymentResult`.
  paymentDelayMs: number
  walletConnection: 'aprovar' | 'recusar'
  quoteChanged: boolean
  timeoutNextOrder: boolean
}
