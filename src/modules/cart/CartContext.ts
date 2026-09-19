import { createContext } from 'react'
import type { CartItem, QuoteResponse } from '../../contracts/api'

export type CartActionResult = { ok: true } | { ok: false; error: string }

// Valores monetarios sao strings decimais vindas da cotacao da API; nunca `number`.
export type CartContextValue = {
  items: CartItem[]
  // As acoes nunca rejeitam: retornam o resultado e tambem expoem a mensagem em `error`/`couponError`.
  addItem: (nftId: string, quantity?: number) => Promise<CartActionResult>
  updateQuantity: (nftId: string, quantity: number) => Promise<CartActionResult>
  removeItem: (nftId: string) => Promise<CartActionResult>
  clearCart: () => Promise<CartActionResult>
  applyCoupon: (code: string) => Promise<CartActionResult>
  removeCoupon: () => Promise<CartActionResult>
  reviewChanges: () => Promise<CartActionResult>
  // Busca carrinho e cotacao frescos na API (revalidacao antes de revisar/confirmar a compra).
  refreshQuote: () => Promise<QuoteResponse>
  getQuantityInCart: (nftId: string) => number
  itemCount: number
  subtotalEth: string
  networkFeeEth: string
  discountEth: string
  totalEth: string
  quote: QuoteResponse | null
  couponCode?: string
  isLoading: boolean
  isQuoteLoading: boolean
  isQuoteFetching: boolean
  isUpdating: boolean
  error: string | null
  couponError: string | null
  clearError: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
