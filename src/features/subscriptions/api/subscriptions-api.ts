import { api } from '@/shared/lib/api-client'
import type { MySubscription, PublicPlan } from '../types'

/**
 * Suscripciones de cliente. El móvil solo ve y gestiona lo suyo: los planes se
 * editan desde el panel, que es web.
 */
export const subscriptionsApi = {
  /** Los planes a la venta. Público: el escaparate se ve sin sesión. */
  plans: () => api.get<{ items: PublicPlan[] }>('/suscripciones/planes', { auth: false }),

  mine: () => api.get<{ subscription: MySubscription | null }>('/suscripciones/mia'),

  subscribe: (planId: string) => api.post<{ subscription: MySubscription }>('/suscripciones/mia', { planId }),

  cancel: () => api.delete<void>('/suscripciones/mia'),
}
