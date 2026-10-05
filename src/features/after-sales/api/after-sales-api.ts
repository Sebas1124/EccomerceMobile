import { api } from '@/shared/lib/api-client'
import type { ResolvedPolicy, ReturnRequest, ReturnableOrder } from '../types'

export const returnsApi = {
  returnable: (orderNumber: string) =>
    api.get<ReturnableOrder>(`/me/orders/${orderNumber}/returnable`),

  request: (orderNumber: string, payload: { orderItemId: string; qty: number; reason: string }) =>
    api.post<{ request: ReturnRequest }>(`/me/orders/${orderNumber}/returns`, payload),

  mine: () => api.get<{ items: ReturnRequest[]; total: number }>('/me/returns'),

  cancel: (id: string) => api.delete<{ request: ReturnRequest }>(`/me/returns/${id}`),
}

export const refundPoliciesApi = {
  /** Pública: no depende de la feature, siempre responde algo. */
  forProduct: (productId: string) =>
    api.get<{ policy: ResolvedPolicy }>(`/refund-policies/for-product/${productId}`, {
      auth: false,
    }),
}
