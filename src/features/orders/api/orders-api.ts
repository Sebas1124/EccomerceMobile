import { api } from '@/shared/lib/api-client'
import type { Order } from '../types'

export const ordersApi = {
  /** Cierra el checkout y crea el pedido. */
  create: (checkoutSessionId: string, paymentMethod = 'manual') =>
    api.post<{ order: Order }>('/me/orders', { checkoutSessionId, paymentMethod }),

  mine: (page = 1, pageSize = 20) =>
    api.get<{ items: Order[]; total: number }>(`/me/orders?page=${page}&pageSize=${pageSize}`),

  get: (number: string) => api.get<{ order: Order }>(`/me/orders/${number}`),

  cancel: (number: string) => api.post<{ order: Order }>(`/me/orders/${number}/cancel`),
}
