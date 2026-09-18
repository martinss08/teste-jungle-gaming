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

export type CartResponse = {
  items: CartLine[]
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

export type QuoteLine = {
  nftId: string
  quantity: number
  unitPriceEth: string
  subtotalEth: string
  available: number
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

export type OrderStatus = 'pendente' | 'confirmado' | 'recusado'

export type OrderReceiptItem = {
  nftId: string
  title: string
  quantity: number
  unitPriceEth: string
  subtotalEth: string
}

export type Order = {
  id: string
  status: OrderStatus
  transaction: string
  explorerUrl: string
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  items: OrderReceiptItem[]
  createdAt: string
  updatedAt: string
}

export type CreateOrderRequest = {
  idempotencyKey: string
  quoteVersion: number
  walletId: string
  network: string
  collector: {
    displayName: string
    username: string
    email: string
    note?: string
  }
}

export type Profile = {
  userId: string
  name: string
  email: string
  username: string
  bio: string
  avatarUrl: string
}

export type UpdateProfileRequest = Partial<Pick<Profile, 'name' | 'email' | 'username' | 'bio' | 'avatarUrl'>>

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type WalletRequest = Omit<Wallet, 'id' | 'status'> & {
  kind: 'principal' | 'secundaria'
}

export type MockScenario = {
  latencyMs: number
  jitterMs: number
  failNext: boolean
  forceSessionExpired: boolean
  paymentResult: 'confirmado' | 'recusado' | 'pendente'
  quoteChanged: boolean
  timeoutNextOrder: boolean
}
