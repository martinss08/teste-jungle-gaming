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

/** O que realmente vai para a URL: apenas os campos diferentes do padrao. */
export type CatalogSearchParams = Partial<CatalogSearch>

export const catalogSearchDefaults: CatalogSearch = {
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

/** Catalogo sem filtros: nenhum parametro na URL. */
export const defaultCatalogSearch: CatalogSearchParams = {}

function searchString(value: unknown, fallback = '') {
  if (typeof value === 'number') return String(value)
  if (typeof value !== 'string') return fallback
  return value.replace(/^"|"$/g, '')
}

/** Completa os campos ausentes na URL com os padroes, para uso na UI e na API. */
export function resolveCatalogSearch(search: Record<string, unknown>): CatalogSearch {
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

/** Remove da URL tudo que esta no valor padrao. */
export function stripCatalogDefaults(search: CatalogSearch): CatalogSearchParams {
  const params: CatalogSearchParams = {}
  for (const key of Object.keys(catalogSearchDefaults) as (keyof CatalogSearch)[]) {
    if (search[key] !== catalogSearchDefaults[key]) Object.assign(params, { [key]: search[key] })
  }
  return params
}

export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearchParams {
  return stripCatalogDefaults(resolveCatalogSearch(search))
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
