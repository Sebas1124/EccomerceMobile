import { create } from 'zustand'
import { notificationsApi } from '../api/notifications-api'
import { obtainToken, platformOf, pushBlocker, type PushBlocker } from '../lib/push'

export type PushStatus =
  /** Aún no se ha intentado. */
  | 'idle'
  /** Este dispositivo no puede recibir avisos remotos. */
  | 'unsupported'
  /** El usuario ha dicho que no. */
  | 'denied'
  | 'registered'
  | 'error'

interface PushState {
  status: PushStatus
  /** Por qué no se puede, cuando `status` es 'unsupported'. */
  blocker: PushBlocker | null
  /** Último fallo, para poder enseñarlo en vez de tragárselo. */
  error: string | null
  /** Token de este dispositivo mientras hay sesión. */
  token: string | null
  /** Registra el dispositivo del usuario que acaba de entrar. */
  register: () => Promise<void>
  /** Da de baja el dispositivo al cerrar sesión, para que no le sigan llegando. */
  unregister: () => Promise<void>
}

export const usePushStore = create<PushState>((set, get) => ({
  status: 'idle',
  blocker: null,
  error: null,
  token: null,

  register: async () => {
    if (get().status === 'registered') return

    const blocker = pushBlocker()
    if (blocker) return set({ status: 'unsupported', blocker, token: null })

    try {
      const token = await obtainToken()
      if (!token) return set({ status: 'denied', token: null, error: null })

      await notificationsApi.registerToken(token, platformOf())
      set({ status: 'registered', token, blocker: null, error: null })
    } catch (error) {
      // Sin avisos la app funciona igual, así que no se interrumpe al usuario;
      // pero el motivo se guarda y se enseña en el perfil, porque un fallo
      // silencioso aquí parece que los avisos van cuando no van.
      set({
        status: 'error',
        token: null,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },

  unregister: async () => {
    const { token } = get()
    set({ status: 'idle', blocker: null, error: null, token: null })
    if (!token) return
    // Si falla, el barrido de tokens abandonados del servidor lo recoge.
    await notificationsApi.removeToken(token).catch(() => undefined)
  },
}))
