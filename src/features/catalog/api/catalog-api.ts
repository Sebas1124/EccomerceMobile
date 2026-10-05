import { api } from '@/shared/lib/api-client'
import type {
  CatalogProduct,
  CatalogProductDetail,
  CatalogSort,
  CategoryNode,
} from '../types'

export interface CatalogQuery {
  category?: string
  search?: string
  sort?: CatalogSort
  page?: number
  pageSize?: number
}

/** Traduce el orden visible a los parámetros de la API. */
const sortParams = (sort: CatalogSort = 'recientes') =>
  ({
    recientes: { sort: 'createdAt', dir: 'desc' },
    'precio-asc': { sort: 'price', dir: 'asc' },
    'precio-desc': { sort: 'price', dir: 'desc' },
    nombre: { sort: 'name', dir: 'asc' },
  })[sort]

export const catalogApi = {
  list: (query: CatalogQuery) => {
    const { sort, dir } = sortParams(query.sort)
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      pageSize: String(query.pageSize ?? 20),
      sort,
      dir,
    })
    if (query.category) params.set('category', query.category)
    if (query.search) params.set('search', query.search)
    return api.get<{ items: CatalogProduct[]; total: number; page: number; pageSize: number }>(
      `/products?${params.toString()}`,
      { auth: false },
    )
  },

  detail: (slug: string) =>
    api.get<{ product: CatalogProductDetail }>(`/products/${slug}`, { auth: false }),

  categories: () => api.get<{ items: CategoryNode[] }>('/categories', { auth: false }),
}
