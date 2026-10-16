import { api } from '@/shared/lib/api-client'
import type { ResolvedSection } from '../types'

/**
 * La portada que ha montado la tienda.
 *
 * Es público: la portada se ve sin haber entrado. El servidor devuelve cada
 * sección ya resuelta —con sus productos, categorías o datos de contacto
 * dentro—, así que aquí no hay que pedir nada más.
 */
export const landingApi = {
  sections: () => api.get<{ sections: ResolvedSection[] }>('/public/landing', { auth: false }),
}
