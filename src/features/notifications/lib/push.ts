import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'
import type { PushPlatform } from '../api/notifications-api'

type NotificationsModule = typeof import('expo-notifications')

let notificationsModule: Promise<NotificationsModule> | null = null

/**
 * Carga `expo-notifications` solo cuando hace falta. El módulo lanza un error
 * nada más importarse en Expo Go para Android (SDK 53+), así que no puede estar
 * en un `import` estático: tiraría abajo toda la app al arrancar.
 *
 * Al cargarlo por primera vez fija qué hace la app con un aviso que llega con
 * ella abierta: se enseña, pero sin sonido ni globo en el icono, que ya está el
 * usuario mirando la pantalla.
 */
export function loadNotifications(): Promise<NotificationsModule> {
  notificationsModule ??= import('expo-notifications').then((module) => {
    module.setNotificationHandler({
      handleNotification: () =>
        Promise.resolve({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
    })
    return module
  })
  return notificationsModule
}

/** Canal de Android. Sin él, Android 13+ ni siquiera pide permiso. */
const ANDROID_CHANNEL = 'default'

export const platformOf = (): PushPlatform =>
  Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB'

/** Por qué no se pueden recibir avisos, cuando no se puede. */
export type PushBlocker = 'web' | 'expo-go-android' | 'sin-project-id'

/**
 * En web no hay token de Expo, y Expo Go dejó de entregar avisos remotos en
 * Android a partir del SDK 53 (en iOS siguen funcionando). Cuando no se puede
 * no se pide permiso: sería una ventana molesta para algo que no va a ir.
 */
export function pushBlocker(): PushBlocker | null {
  if (Platform.OS === 'web') return 'web'
  if (
    Platform.OS === 'android' &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return 'expo-go-android'
  }
  // Sin id de proyecto EAS, Expo no sabe a qué app pertenece el token.
  if (!projectId()) return 'sin-project-id'
  return null
}

export const pushSupported = () => pushBlocker() === null

/** El id del proyecto EAS; sin él Expo no sabe a qué app pertenece el token. */
const projectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId

export type PushPermission = 'granted' | 'denied'

/**
 * Pide permiso una sola vez. Si ya está decidido no se vuelve a preguntar:
 * iOS solo muestra el diálogo la primera vez y después hay que ir a Ajustes.
 */
export async function ensurePermission(): Promise<PushPermission> {
  const Notifications = await loadNotifications()

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Avisos',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return 'granted'
  if (!current.canAskAgain) return 'denied'

  const asked = await Notifications.requestPermissionsAsync()
  return asked.granted ? 'granted' : 'denied'
}

/** Token de este dispositivo, o null si el usuario no quiere avisos. */
export async function obtainToken(): Promise<string | null> {
  if ((await ensurePermission()) !== 'granted') return null

  // `pushBlocker` ya ha garantizado que hay id de proyecto.
  const Notifications = await loadNotifications()
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() as string })
  return data
}
