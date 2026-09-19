import type { FavoriteResponse, NftListParams, NftListResponse } from '../../contracts/api'
import { api } from '../../lib/api'
import type { Nft } from '../../types'

export async function listNfts(params: NftListParams, signal?: AbortSignal) {
  const { data } = await api.get<NftListResponse>('/nfts', { params, signal })
  return data
}

export async function getNft(nftId: string) {
  const { data } = await api.get<Nft>(`/nfts/${nftId}`)
  return data
}

export async function getFavorites() {
  const { data } = await api.get<FavoriteResponse>('/favorites')
  return data
}

export async function addFavorite(nftId: string) {
  const { data } = await api.post<FavoriteResponse>(`/favorites/${nftId}`)
  return data
}

export async function removeFavorite(nftId: string) {
  const { data } = await api.delete<FavoriteResponse>(`/favorites/${nftId}`)
  return data
}
