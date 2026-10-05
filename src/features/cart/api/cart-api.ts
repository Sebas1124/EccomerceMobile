import { api } from '@/shared/lib/api-client'
import type { CartSummary } from '../types'

export const cartApi = {
  get: () => api.get<{ cart: CartSummary }>('/cart'),

  addItem: (variantId: string, qty = 1) =>
    api.post<{ cart: CartSummary }>('/cart/items', { variantId, qty }),

  setQty: (itemId: string, qty: number) =>
    api.patch<{ cart: CartSummary }>(`/cart/items/${itemId}`, { qty }),

  removeItem: (itemId: string) => api.delete<{ cart: CartSummary }>(`/cart/items/${itemId}`),

  clear: () => api.delete<{ cart: CartSummary }>('/cart'),

  /** Suma el carrito de invitado al del servidor tras iniciar sesión. */
  merge: (items: { variantId: string; qty: number }[]) =>
    api.post<{ cart: CartSummary }>('/cart/merge', { items }),
}
