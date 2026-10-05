import { io, type Socket } from 'socket.io-client'
import { API_BASE, refreshSession, session } from './api-client'

/** El socket va al mismo servidor que la API, pero fuera del prefijo de versión. */
const socketOrigin = () => new URL(API_BASE).origin

/**
 * Abre un namespace autenticado.
 *
 * El access token dura 10 minutos, así que se renueva antes de conectar si no
 * hay ninguno: un handshake sin token se rechaza y el socket no reintentaría
 * con credenciales nuevas por su cuenta.
 */
export async function connectNamespace(namespace: string): Promise<Socket> {
  if (!session.getAccessToken()) await refreshSession()

  const socket = io(`${socketOrigin()}${namespace}`, {
    transports: ['websocket'],
    auth: (cb) => cb({ token: session.getAccessToken() }),
  })

  socket.on('connect_error', (error) => {
    if (error.message !== 'UNAUTHORIZED') return
    void refreshSession().then((ok) => {
      if (ok) socket.connect()
    })
  })

  return socket
}
