import { api } from '@/shared/lib/api-client'

export type PushPlatform = 'IOS' | 'ANDROID' | 'WEB'

export type NotificationKind =
  | 'ORDER'
  | 'PROMOTION'
  | 'PRODUCT'
  | 'SYSTEM'
  | 'TICKET'
  | 'CHAT'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  route: string | null
  userId: string | null
  createdAt: string
  /** Lo calcula el servidor: las difusiones no llevan estado propio. */
  read: boolean
}

export const notificationsApi = {
  registerToken: (token: string, platform: PushPlatform) =>
    api.post<void>('/me/push-tokens', { token, platform }),

  removeToken: (token: string) => api.delete<void>(`/me/push-tokens/${encodeURIComponent(token)}`),

  mine: () =>
    api.get<{ items: AppNotification[]; total: number; unread: number }>('/me/notifications'),

  unread: () => api.get<{ unread: number }>('/me/notifications/unread'),

  markAllRead: () => api.post<{ readAt: string }>('/me/notifications/read'),

  markRead: (id: string) => api.post<void>(`/me/notifications/${id}/read`),
}
