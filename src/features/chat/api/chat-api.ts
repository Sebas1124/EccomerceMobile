import { api } from '@/shared/lib/api-client'

export type ChatMessageKind = 'TEXT' | 'IMAGE'

/** Catálogo cerrado de reacciones; el servidor no acepta otra cosa. */
export type ChatReactionKind = 'LIKE' | 'LOVE' | 'THANKS' | 'SMILE' | 'WOW' | 'SAD'

export interface ChatReaction {
  id: string
  kind: ChatReactionKind
  userId: string
}

/** Lo justo del mensaje citado para pintarlo. */
export interface QuotedMessage {
  id: string
  body: string
  kind: ChatMessageKind
  fromStaff: boolean
}

export interface ChatMessage {
  id: string
  body: string
  kind: ChatMessageKind
  imageUrl: string | null
  fromStaff: boolean
  createdAt: string
  author: { id: string; firstName: string; lastName: string } | null
  replyTo: QuotedMessage | null
  reactions: ChatReaction[]
}

/** Respuesta del historial: mensajes y hasta cuándo ha leído cada lado. */
export interface ChatHistory {
  items: ChatMessage[]
  hasMore: boolean
  customerReadAt: string | null
  staffReadAt: string | null
}

export interface ChatConversation {
  id: string
  lastMessageAt: string
  customerReadAt: string | null
}

/** Disponibilidad del chat: si la tienda está ausente y hasta cuándo. */
export interface ChatAvailability {
  away: boolean
  awayUntil: string | null
  awayMessage: string
}

export const chatApi = {
  /** Abre o recupera su conversación. */
  mine: () =>
    api.get<{
      conversation: ChatConversation
      unread: number
      availability: ChatAvailability
    }>('/me/chat'),

  messages: (conversationId: string, before?: string) => {
    const query = before ? `?before=${encodeURIComponent(before)}` : ''
    return api.get<ChatHistory>(`/me/chat/${conversationId}/messages${query}`)
  },
}
