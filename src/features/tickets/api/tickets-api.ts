import { api } from '@/shared/lib/api-client'

export type TicketStatus = 'OPEN' | 'WAITING_CUSTOMER' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface TicketMessage {
  id: string
  body: string
  createdAt: string
  author: { id: string; firstName: string; lastName: string; role?: string } | null
}

export interface Ticket {
  id: string
  number: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  lastMessageAt: string
  createdAt: string
  order: { number: string } | null
  messages?: TicketMessage[]
}

export const ticketsApi = {
  mine: () => api.get<{ items: Ticket[]; total: number }>('/me/tickets'),

  get: (number: string) => api.get<{ ticket: Ticket }>(`/me/tickets/${number}`),

  create: (payload: { subject: string; body: string; orderNumber: string | null }) =>
    api.post<{ ticket: Ticket }>('/me/tickets', payload),

  reply: (number: string, body: string) =>
    api.post<{ ticket: Ticket }>(`/me/tickets/${number}/messages`, { body }),

  close: (number: string) => api.post<{ ticket: Ticket }>(`/me/tickets/${number}/close`),
}
