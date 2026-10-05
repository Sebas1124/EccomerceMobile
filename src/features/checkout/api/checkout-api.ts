import { api } from '@/shared/lib/api-client'
import type { CheckoutSession, ShippingAddress } from '../types'

export const checkoutApi = {
  /** Abre el checkout y reserva el stock durante 10 minutos. */
  start: (shippingAddress?: ShippingAddress) =>
    api.post<{ session: CheckoutSession }>('/checkout/sessions', { shippingAddress }),

  get: (id: string) => api.get<{ session: CheckoutSession }>(`/checkout/sessions/${id}`),

  setAddress: (id: string, address: ShippingAddress) =>
    api.patch<{ session: CheckoutSession }>(`/checkout/sessions/${id}/address`, address),

  applyPromoCode: (id: string, code: string) =>
    api.put<{ session: CheckoutSession }>(`/checkout/sessions/${id}/promo-code`, { code }),

  removePromoCode: (id: string) =>
    api.delete<{ session: CheckoutSession }>(`/checkout/sessions/${id}/promo-code`),

  cancel: (id: string) => api.delete<{ session: CheckoutSession }>(`/checkout/sessions/${id}`),
}
