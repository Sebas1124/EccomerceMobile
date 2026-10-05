import { api } from '@/shared/lib/api-client'
import type { User } from '@/features/auth'
import type { AccountOverview, Address, AddressPayload, DeletionRequest } from '../types'

export const accountApi = {
  overview: () => api.get<AccountOverview>('/me/profile'),

  updateProfile: (payload: { firstName: string; lastName: string; phone: string | null }) =>
    api.patch<{ user: User }>('/me/profile', payload),

  // -- Direcciones ------------------------------------------------------------
  addresses: () => api.get<{ items: Address[]; total: number }>('/me/addresses'),

  createAddress: (payload: AddressPayload) =>
    api.post<{ address: Address }>('/me/addresses', payload),

  updateAddress: (id: string, payload: AddressPayload) =>
    api.put<{ address: Address }>(`/me/addresses/${id}`, payload),

  setDefaultAddress: (id: string) => api.patch<{ address: Address }>(`/me/addresses/${id}/default`),

  removeAddress: (id: string) => api.delete<void>(`/me/addresses/${id}`),

  // -- Baja -------------------------------------------------------------------
  requestDeletion: (reason: string | null) =>
    api.post<{ sentTo: string }>('/me/deletion-request', { reason }),

  confirmDeletion: (code: string) =>
    api.post<{ request: DeletionRequest }>('/me/deletion-request/confirm', { code }),

  cancelDeletion: () => api.delete<void>('/me/deletion-request'),
}
