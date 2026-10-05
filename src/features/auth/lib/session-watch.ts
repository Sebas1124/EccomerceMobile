import type { Socket } from 'socket.io-client'
import { notify } from '@/shared/feedback'
import { connectNamespace } from '@/shared/lib/socket'
import { useAuthStore } from '../store/auth-store'
import { authTexts as t } from '../texts'

/**
 * Cierre de sesión instantáneo entre dispositivos.
 *
 * Al cerrar esta sesión desde la web (o desde otro móvil), el servidor avisa
 * por socket a este dispositivo concreto. Sin esto el móvil seguiría pareciendo
 * dentro hasta que caducara su access token, hasta diez minutos después.
 *
 * No es un hook a propósito: va en el arranque, como el resto del estado
 * global, y así no depende de que una pantalla concreta esté montada.
 */
let socket: Socket | null = null
/** Evita abrir dos sockets si el estado cambia mientras uno está conectándose. */
let opening = false

function close() {
  socket?.disconnect()
  socket = null
}

async function open() {
  if (socket || opening) return
  opening = true
  try {
    const connection = await connectNamespace('/')

    // La sesión pudo cerrarse mientras se conectaba.
    if (useAuthStore.getState().status !== 'authenticated') {
      connection.disconnect()
      return
    }

    connection.on('session:revoked', () => {
      notify.warning(t.login.ended.closed)
      useAuthStore.getState().endSession('closed')
    })
    socket = connection
  } catch {
    // Sin socket la app sigue: el cierre se notará al renovar el token.
  } finally {
    opening = false
  }
}

/** Arranca el vigilante. Se llama una vez al cargar la app. */
export function watchRevokedSessions() {
  const sync = (status: string) => {
    if (status === 'authenticated') void open()
    else close()
  }

  sync(useAuthStore.getState().status)
  useAuthStore.subscribe((state, previous) => {
    if (state.status !== previous.status) sync(state.status)
  })
}
