import type { Profile } from '../../contracts/api'
import { api } from '../../lib/api'
import type { Wallet } from '../../types'

export async function getProfile() {
  const { data } = await api.get<Profile>('/profile')
  return data
}

export async function getWallets() {
  const { data } = await api.get<{ items: Wallet[] }>('/wallets')
  return data.items
}
