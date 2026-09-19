import type {
  ChangePasswordRequest,
  Profile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  WalletListResponse,
  WalletRequest,
} from '../../contracts/api'
import { api } from '../../lib/api'
import type { Wallet } from '../../types'

export async function getProfile() {
  const { data } = await api.get<Profile>('/profile')
  return data
}

export async function updateProfile(payload: UpdateProfileRequest) {
  const { data } = await api.patch<Profile>('/profile', payload)
  return data
}

export async function updateAvatar(payload: UpdateAvatarRequest) {
  const { data } = await api.post<Profile>('/profile/avatar', payload)
  return data
}

export async function changePassword(payload: ChangePasswordRequest) {
  const { data } = await api.post<{ ok: true }>('/profile/password', payload)
  return data
}

export async function getWallets() {
  const { data } = await api.get<WalletListResponse>('/wallets')
  return data.items
}

export async function createWallet(payload: WalletRequest) {
  const { data } = await api.post<Wallet>('/wallets', payload)
  return data
}

export async function updateWallet(walletId: string, payload: Partial<WalletRequest>) {
  const { data } = await api.patch<Wallet>(`/wallets/${walletId}`, payload)
  return data
}
