import { useState } from 'react'
import type { CartLine } from '../../types'
import { nfts } from '../../data/nfts'
import { CartContext } from './CartContext'
const storageKey = 'greenmint-cart-v1'

function readInitialCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as CartLine[]) : [{ nftId: 'emerald-ape-042', quantity: 1 }]
  } catch {
    return [{ nftId: 'emerald-ape-042', quantity: 1 }]
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(readInitialCart)

  const persist = (next: CartLine[]) => {
    setItems(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const addItem = (nftId: string, quantity = 1) => {
    const nft = nfts.find((item) => item.id === nftId)
    const next = [...items]
    const current = next.find((line) => line.nftId === nftId)
    if (current) {
      current.quantity = Math.min((nft?.available ?? 1), current.quantity + quantity)
    } else {
      next.push({ nftId, quantity })
    }
    persist(next)
  }

  const updateQuantity = (nftId: string, quantity: number) => {
    const nft = nfts.find((item) => item.id === nftId)
    const bounded = Math.max(1, Math.min(nft?.available ?? 1, quantity))
    persist(items.map((line) => (line.nftId === nftId ? { ...line, quantity: bounded } : line)))
  }

  const removeItem = (nftId: string) => persist(items.filter((line) => line.nftId !== nftId))
  const clearCart = () => persist([])

  const subtotalEth = items.reduce((total, line) => {
    const nft = nfts.find((item) => item.id === line.nftId)
    return total + Number(nft?.priceEth ?? 0) * line.quantity
  }, 0)
  const discountEth = subtotalEth > 4 ? 0.18 : 0
  const networkFeeEth = items.length ? 0.07 : 0
  const totalEth = Math.max(0, subtotalEth - discountEth + networkFeeEth)
  const itemCount = items.reduce((total, line) => total + line.quantity, 0)

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
