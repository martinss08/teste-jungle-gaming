import { createContext } from 'react'
import type { CartLine } from '../../types'

export type CartContextValue = {
  items: CartLine[]
  addItem: (nftId: string, quantity?: number) => void
  updateQuantity: (nftId: string, quantity: number) => void
  removeItem: (nftId: string) => void
  clearCart: () => void
  itemCount: number
  subtotalEth: number
  networkFeeEth: number
  discountEth: number
  totalEth: number
}

export const CartContext = createContext<CartContextValue | null>(null)
