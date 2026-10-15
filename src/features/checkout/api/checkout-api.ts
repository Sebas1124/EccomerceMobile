import { api } from '@/shared/lib/api-client'
import type { CheckoutSession, ShippingAddress } from '../types'

/** Un cupón que este cliente ya tiene: regalado o de bienvenida. */
export interface MyPromoCode {
  id: string
  code: string
  kind: 'PERCENT' | 'FIXED'
  /** Porcentaje (1-100) o céntimos, según `kind`. */
  value: number
  audience: 'EVERYONE' | 'NEW_CUSTOMERS' | 'SPECIFIC'
}

export const promoCodesApi = {
  /**
   * Los cupones que puede usar quien ha iniciado sesión: los que le han
   * regalado y, si no ha comprado nunca, los de bienvenida. Los públicos no.
   */
  mine: () => api.get<{ items: MyPromoCode[]; total: number }>('/me/promo-codes'),
}

// La ayuda para rellenar direcciones vive en `features/address-lookup`: la usan
// el checkout y la libreta de direcciones, y no es cosa del checkout.

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
