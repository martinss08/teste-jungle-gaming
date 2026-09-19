import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { CartResponse, NftListResponse, NftUpdatedEvent, Order, OrderUpdatedEvent } from '../../contracts/api'
import type { Nft } from '../../types'

// Aplica eventos em tempo real no cache do TanStack Query. So substitui dados quando a versao
// do evento e mais nova que a versao que ja esta em cache (evento antigo nao sobrescreve REST novo).

function patchNft(nft: Nft, event: NftUpdatedEvent): Nft {
  if (nft.id !== event.resource.id || (nft.version ?? 0) >= event.version) return nft
  return { ...nft, ...event.data, version: event.version }
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  const nftId = event.resource.id
  queryClient.setQueryData<Nft>(['nft', nftId], (current) => (current ? patchNft(current, event) : current))
  queryClient.setQueriesData<NftListResponse>({ queryKey: ['nfts'] }, (page) =>
    page ? { ...page, items: page.items.map((item) => patchNft(item, event)) } : page,
  )

  // No carrinho os valores oficiais vem da cotacao da API: se o NFT esta no carrinho, recalcula.
  // A cotacao nova sinaliza `stale`, o que bloqueia o checkout ate o usuario aceitar.
  const inCart = queryClient
    .getQueriesData<CartResponse>({ queryKey: ['cart'] })
    .some(([, cart]) => cart?.items.some((item) => item.nftId === nftId))
  if (inCart) void queryClient.invalidateQueries({ queryKey: ['quote'] })
}

export function applyOrderUpdated(queryClient: QueryClient, userId: string, event: OrderUpdatedEvent) {
  queryClient.setQueryData<Order>(['order', userId, event.resource.id], (current) =>
    current && current.version >= event.version ? current : event.data,
  )
}

// Resposta REST que chega depois de um evento mais novo nao deve regredir o cache.
export function keepNewer<T extends { version?: number }>(queryClient: QueryClient, queryKey: QueryKey, fresh: T): T {
  const cached = queryClient.getQueryData<T>(queryKey)
  return cached && (cached.version ?? 0) > (fresh.version ?? 0) ? cached : fresh
}

// Apos reconectar, eventos podem ter sido perdidos: recarrega da API o que estiver em tela.
export function reconcileActiveQueries(queryClient: QueryClient) {
  for (const queryKey of [['nfts'], ['nft'], ['cart'], ['quote'], ['order']]) {
    void queryClient.invalidateQueries({ queryKey, refetchType: 'active' })
  }
}
