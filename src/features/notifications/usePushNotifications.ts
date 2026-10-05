import { useRouter, type Href } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth'
import { usePushStore } from './store/push-store'

/** La ruta que el servidor mete en el aviso, si la trae. */
const routeOf = (response: Notifications.NotificationResponse | null) => {
  const data = response?.notification.request.content.data as { route?: unknown } | undefined
  return typeof data?.route === 'string' && data.route.startsWith('/') ? data.route : null
}

/**
 * Engancha los avisos push a la sesión: se registra el dispositivo al entrar,
 * se da de baja al salir y al tocar un aviso se abre la pantalla que indica.
 * Se monta una sola vez, en el layout raíz.
 */
export function usePushNotifications() {
  const router = useRouter()
  const status = useAuthStore((s) => s.status)
  const response = Notifications.useLastNotificationResponse()
  /** Un aviso ya atendido no vuelve a navegar aunque el hook lo repita. */
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') void usePushStore.getState().register()
    if (status === 'anonymous') void usePushStore.getState().unregister()
  }, [status])

  useEffect(() => {
    if (!response) return
    const id = response.notification.request.identifier
    if (handled.current === id) return
    handled.current = id

    const route = routeOf(response)
    if (route) router.push(route as Href)
  }, [response, router])
}
