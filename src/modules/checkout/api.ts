import type { ConnectWalletRequest, CreateOrderRequest, Order, WalletConnection } from '../../contracts/api'
import { api } from '../../lib/api'

export async function connectWallet(payload: ConnectWalletRequest) {
  const { data } = await api.post<WalletConnection>('/wallets/connect', payload)
  return data
}

export async function createOrder(payload: CreateOrderRequest) {
  const { data } = await api.post<Order>('/orders', payload)
  return data
}

export async function getOrder(orderId: string) {
  const { data } = await api.get<Order>(`/orders/${encodeURIComponent(orderId)}`)
  return data
}
