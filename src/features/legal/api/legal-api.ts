import { api } from '@/shared/lib/api-client'

export interface LegalSummary {
  slug: string
  title: string
  summary: string | null
  version: number
  updatedAt: string
}

export interface LegalDocument extends LegalSummary {
  id: string
  /** HTML ya saneado en el servidor. */
  content: string
}

export const legalApi = {
  /** No necesita sesión: la información legal se ve siempre. */
  list: () => api.get<{ items: LegalSummary[]; total: number }>('/legal', { auth: false }),

  get: (slug: string) =>
    api.get<{ document: LegalDocument }>(`/legal/${slug}`, { auth: false }),
}
