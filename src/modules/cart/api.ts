import type {
  AddCartItemRequest,
  ApplyCouponRequest,
  CartResponse,
  QuoteResponse,
  UpdateCartItemRequest,
} from '../../contracts/api'
import { api } from '../../lib/api'

export async function getCart() {
  const { data } = await api.get<CartResponse>('/cart')
  return data
}

export async function addCartItem(payload: AddCartItemRequest) {
  const { data } = await api.post<CartResponse>('/cart/items', payload)
  return data
}

export async function updateCartItem(nftId: string, payload: UpdateCartItemRequest) {
  const { data } = await api.patch<CartResponse>(`/cart/items/${nftId}`, payload)
  return data
}

export async function removeCartItem(nftId: string) {
  const { data } = await api.delete<CartResponse>(`/cart/items/${nftId}`)
  return data
}

export async function applyCoupon(payload: ApplyCouponRequest) {
  const { data } = await api.post<CartResponse>('/cart/coupon', payload)
  return data
}

export async function removeCoupon() {
  const { data } = await api.delete<CartResponse>('/cart/coupon')
  return data
}

export async function reviewCart() {
  const { data } = await api.post<CartResponse>('/cart/review')
  return data
}

export async function getQuote() {
  const { data } = await api.get<QuoteResponse>('/quote')
  return data
}
