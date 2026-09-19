import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { CartResponse } from '../../contracts/api'
import { readApiError } from '../../lib/apiError'
import { useAuth } from '../auth/useAuth'
import { CartContext, type CartActionResult } from './CartContext'
import {
  addCartItem,
  applyCoupon as applyCouponRequest,
  getCart,
  getQuote,
  removeCartItem,
  removeCoupon as removeCouponRequest,
  reviewCart,
  updateCartItem,
} from './api'

const cartMutationKey = ['cart-mutation'] as const
const zeroEth = '0.000'
const cartErrorFallback = 'Nao foi possivel atualizar o carrinho.'
const couponErrorFallback = 'Nao foi possivel aplicar o cupom.'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { session, isLoading: isSessionLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // O dono do carrinho entra na chave para que visitante e usuarios nunca compartilhem cache.
  const owner = session?.user.id ?? 'guest'
  const cartKey = ['cart', owner] as const
  const quoteKey = ['quote', owner] as const

  const cartQuery = useQuery({
    queryKey: cartKey,
    queryFn: getCart,
    enabled: !isSessionLoading,
  })

  const quoteQuery = useQuery({
    queryKey: quoteKey,
    queryFn: getQuote,
    enabled: !isSessionLoading,
  })

  const syncAfterMutation = async (cart?: CartResponse) => {
    if (cart) queryClient.setQueryData(cartKey, cart)
    else await queryClient.invalidateQueries({ queryKey: cartKey })
    await queryClient.invalidateQueries({ queryKey: quoteKey })
  }

  const cartMutation = useMutation({
    mutationKey: cartMutationKey,
    mutationFn: (request: () => Promise<CartResponse>) => request(),
    onMutate: () => setError(null),
    onSuccess: (cart) => syncAfterMutation(cart),
    onError: async (err) => {
      setError(readApiError(err, cartErrorFallback))
      // Conflitos (estoque/preco) significam que o servidor mudou: ressincroniza.
      await syncAfterMutation()
    },
  })

  const couponMutation = useMutation({
    mutationKey: cartMutationKey,
    mutationFn: (request: () => Promise<CartResponse>) => request(),
    onMutate: () => setCouponError(null),
    onSuccess: (cart) => syncAfterMutation(cart),
    onError: (err) => setCouponError(readApiError(err, couponErrorFallback)),
  })

  const isUpdating = useIsMutating({ mutationKey: cartMutationKey }) > 0

  const run = async (
    mutation: typeof cartMutation,
    request: () => Promise<CartResponse>,
    fallback: string,
    successNotice: string,
  ): Promise<CartActionResult> => {
    setNotice(null)
    try {
      await mutation.mutateAsync(request)
      setNotice(successNotice)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: readApiError(err, fallback) }
    }
  }
  const runCart = (request: () => Promise<CartResponse>, successNotice: string) =>
    run(cartMutation, request, cartErrorFallback, successNotice)
  const runCoupon = (request: () => Promise<CartResponse>, successNotice: string) =>
    run(couponMutation, request, couponErrorFallback, successNotice)

  const items = cartQuery.data?.items ?? []
  const quote = quoteQuery.data ?? null

  const value = {
    items,
    addItem: (nftId: string, quantity = 1) => runCart(() => addCartItem({ nftId, quantity }), 'Item adicionado ao carrinho.'),
    updateQuantity: (nftId: string, quantity: number) =>
      runCart(() => updateCartItem(nftId, { quantity }), `Quantidade atualizada para ${quantity}.`),
    removeItem: (nftId: string) => runCart(() => removeCartItem(nftId), 'Item removido do carrinho.'),
    clearCart: async () => {
      if (!items.length) return { ok: true } as const
      return runCart(async () => {
        // Remocoes sequenciais para nao disputar o mesmo recurso.
        let cart: CartResponse | undefined
        for (const item of items) cart = await removeCartItem(item.nftId)
        return cart as CartResponse
      }, 'Carrinho esvaziado.')
    },
    applyCoupon: (code: string) => runCoupon(() => applyCouponRequest({ code: code.trim() }), 'Cupom aplicado.'),
    removeCoupon: () => runCoupon(removeCouponRequest, 'Cupom removido.'),
    reviewChanges: () => runCart(reviewCart, 'Valores e quantidades atualizados.'),
    refreshQuote: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKey })
      return queryClient.query({ queryKey: quoteKey, queryFn: getQuote, staleTime: 0 })
    },
    getQuantityInCart: (nftId: string) => items.find((item) => item.nftId === nftId)?.quantity ?? 0,
    itemCount: items.length,
    subtotalEth: quote?.subtotalEth ?? zeroEth,
    discountEth: quote?.discountEth ?? zeroEth,
    networkFeeEth: quote?.networkFeeEth ?? zeroEth,
    totalEth: quote?.totalEth ?? zeroEth,
    quote,
    couponCode: cartQuery.data?.couponCode,
    isLoading: isSessionLoading || cartQuery.isPending,
    isQuoteLoading: isSessionLoading || quoteQuery.isPending,
    isQuoteFetching: quoteQuery.isFetching,
    isUpdating,
    error:
      error ??
      (cartQuery.isError ? 'Nao foi possivel carregar o carrinho.' : null) ??
      (quoteQuery.isError ? 'Nao foi possivel calcular a cotacao.' : null),
    couponError,
    notice,
    clearError: () => setError(null),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
