import type { NftListParams } from '../../contracts/api'

export type CatalogSearch = {
  q: string
  rarity: string
  category: string
  network: string
  tag: string
  minPrice: string
  maxPrice: string
  sort: string
  page: number
}

export const defaultCatalogSearch: CatalogSearch = {
  q: '',
  rarity: 'todos',
  category: 'todos',
  network: 'todos',
  tag: 'todos',
  minPrice: '',
  maxPrice: '',
  sort: 'recentes',
  page: 1,
}

function searchString(value: unknown, fallback = '') {
  if (typeof value === 'number') return String(value)
  if (typeof value !== 'string') return fallback
  return value.replace(/^"|"$/g, '')
}

export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const page = Number(search.page || 1)
  return {
    q: searchString(search.q),
    rarity: searchString(search.rarity, 'todos'),
    category: searchString(search.category, 'todos'),
    network: searchString(search.network, 'todos'),
    tag: searchString(search.tag, 'todos'),
    minPrice: searchString(search.minPrice),
    maxPrice: searchString(search.maxPrice),
    sort: searchString(search.sort, 'recentes'),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

const withoutAll = (value: string) => (value === 'todos' ? undefined : value)

export function toNftListParams(search: CatalogSearch, pageSize: number): NftListParams {
  return {
    q: search.q || undefined,
    rarity: withoutAll(search.rarity) as NftListParams['rarity'],
    category: withoutAll(search.category),
    network: withoutAll(search.network),
    tag: withoutAll(search.tag) as NftListParams['tag'],
    minPrice: search.minPrice || undefined,
    maxPrice: search.maxPrice || undefined,
    sort: search.sort as NftListParams['sort'],
    page: search.page,
    pageSize,
  }
}
