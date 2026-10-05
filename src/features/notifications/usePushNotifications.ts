import { useRouter, type Href } from 'expo-router'
import type { NotificationResponse } from 'expo-notifications'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth'
import { loadNotifications, pushSupported } from './lib/push'
import { usePushStore } from './store/push-store'

/** La ruta que el servidor mete en el aviso, si la trae. */
const routeOf = (response: NotificationResponse) => {
  const data = response.notification.request.content.data as { route?: unknown } | undefined
  return typeof data?.route === 'string' && data.route.startsWith('/') ? data.route : null
}

/**
 * Engancha los avisos push a la sesión: se registra el dispositivo al entrar,
 * se da de baja al salir y al tocar un aviso se abre la pantalla que indica.
 * Se monta una sola vez, en el layout raíz.
 *
 * `expo-notifications` solo se carga si el dispositivo puede recibir avisos:
 * en Expo Go para Android el módulo falla al importarse.
 */
export function usePushNotifications() {
  const router = useRouter()
  const status = useAuthStore((s) => s.status)
  /** Un aviso ya atendido no vuelve a navegar aunque se repita. */
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') void usePushStore.getState().register()
    if (status === 'anonymous') void usePushStore.getState().unregister()
  }, [status])

  useEffect(() => {
    if (!pushSupported()) return

    let active = true
    let subscription: { remove: () => void } | undefined

    const open = (response: NotificationResponse) => {
      const id = response.notification.request.identifier
      if (handled.current === id) return
      handled.current = id

      const route = routeOf(response)
      if (route) router.push(route as Href)
    }

    void loadNotifications()
      .then(async (Notifications) => {
        if (!active) return
        // Aviso que abrió la app desde cerrada.
        const last = await Notifications.getLastNotificationResponseAsync()
        if (active && last) open(last)
        if (!active) return
        // Avisos tocados con la app ya en marcha.
        subscription = Notifications.addNotificationResponseReceivedListener(open)
      })
      .catch(() => undefined)

    return () => {
      active = false
      subscription?.remove()
    }
  }, [router])
}
