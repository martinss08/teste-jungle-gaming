import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FavoriteResponse } from '../../contracts/api'
import { useAuth } from '../auth/useAuth'
import { useProtectedAction } from '../auth/useProtectedAction'
import { addFavorite, getFavorites, removeFavorite } from './api'

type FavoriteChange = { nftId: string; favorite: boolean }

export function useFavorites() {
  const queryClient = useQueryClient()
  const { session, isAuthenticated } = useAuth()
  const runProtected = useProtectedAction()
  const [error, setError] = useState<string | null>(null)
  const favoritesKey = ['favorites', session?.user.id] as const

  const favoritesQuery = useQuery({
    queryKey: favoritesKey,
    queryFn: getFavorites,
    enabled: isAuthenticated,
  })

  const mutation = useMutation({
    mutationFn: ({ nftId, favorite }: FavoriteChange) => (favorite ? addFavorite(nftId) : removeFavorite(nftId)),
    onMutate: async ({ nftId, favorite }) => {
      setError(null)
      await queryClient.cancelQueries({ queryKey: favoritesKey })
      const previous = queryClient.getQueryData<FavoriteResponse>(favoritesKey)
      queryClient.setQueryData<FavoriteResponse>(favoritesKey, {
        nftIds: favorite
          ? [...(previous?.nftIds ?? []), nftId]
          : (previous?.nftIds ?? []).filter((id) => id !== nftId),
        items: favorite ? previous?.items ?? [] : (previous?.items ?? []).filter((item) => item.id !== nftId),
      })
      return { previous }
    },
    onError: (_err, _change, context) => {
      queryClient.setQueryData(favoritesKey, context?.previous)
      setError('Nao foi possivel atualizar os favoritos. Tente novamente.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoritesKey }),
  })

  const isFavorite = (nftId: string) => Boolean(favoritesQuery.data?.nftIds.includes(nftId))

  return {
    favorites: favoritesQuery.data,
    isLoading: favoritesQuery.isPending && isAuthenticated,
    isError: favoritesQuery.isError,
    refetch: favoritesQuery.refetch,
    isFavorite,
    toggleFavorite: (nftId: string) => runProtected(() => mutation.mutate({ nftId, favorite: !isFavorite(nftId) })),
    isPending: (nftId: string) => mutation.isPending && mutation.variables?.nftId === nftId,
    error,
  }
}
