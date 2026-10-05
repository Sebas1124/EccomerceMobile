/** Textos de los avisos push en el móvil. */
export const notificationsTexts = {
  statusTitle: 'Avisos',
  statusRegistered: 'Este dispositivo recibe avisos de tus pedidos y de las novedades.',
  statusDenied:
    'No has dado permiso para recibir avisos. Puedes cambiarlo en los ajustes del sistema.',
  statusError: 'No se pudo registrar este dispositivo para recibir avisos.',

  bell: 'Avisos',
  bellEmpty: 'No tienes ningún aviso.',
  markAllRead: 'Marcar todo como leído',
  allRead: 'Avisos marcados como leídos',
  loadError: 'No se pudieron cargar los avisos',

  blockers: {
    web: 'Los avisos solo llegan a la aplicación del móvil, no al navegador.',
    'expo-go-android':
      'Expo Go ya no entrega avisos en Android. Hace falta una compilación de desarrollo de la app.',
    'sin-project-id':
      'Falta el identificador de proyecto de EAS en la configuración de la app, así que Expo no puede emitir el token de este dispositivo.',
  },
} as const
