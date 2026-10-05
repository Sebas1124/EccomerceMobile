import { create } from 'zustand'
import { refreshSession, session, type SessionEndReason } from '@/shared/lib/api-client'
import { authApi } from '../api/auth-api'
import type { User } from '../types'

export type LoginOutcome = { requires2fa: true; challengeId: string } | { requires2fa: false; user: User }

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'

interface AuthState {
  status: AuthStatus
  user: User | null
  endReason: SessionEndReason | null
  /** Recupera la sesión guardada en SecureStore al abrir la app. */
  bootstrap: () => Promise<void>
  /** Devuelve el usuario, o el challenge si hace falta el segundo factor. */
  login: (email: string, password: string) => Promise<LoginOutcome>
  verifyTwoFactor: (challengeId: string, code: string) => Promise<User>
  logout: () => Promise<void>
  /**
   * Da la sesión por terminada sin llamar a la API: ya no vale en el servidor.
   * La usa el cierre desde otro dispositivo y el refresh que vuelve rechazado.
   */
  endSession: (reason: SessionEndReason) => void
  clearEndReason: () => void
  /** Refresca el usuario en memoria tras editar el perfil. */
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  endReason: null,

  bootstrap: async () => {
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    try {
      if (!(await refreshSession())) return set({ status: 'anonymous', user: null })
      const { user } = await authApi.me()
      set({ status: 'authenticated', user })
    } catch {
      set({ status: 'anonymous', user: null })
    }
  },

  login: async (email, password) => {
    const result = await authApi.login(email, password)
    if ('requires2fa' in result) return { requires2fa: true, challengeId: result.challengeId }
    await session.store(result)
    set({ status: 'authenticated', user: result.user, endReason: null })
    return { requires2fa: false, user: result.user }
  },

  verifyTwoFactor: async (challengeId, code) => {
    const result = await authApi.verifyTwoFactor(challengeId, code)
    await session.store(result)
    set({ status: 'authenticated', user: result.user, endReason: null })
    return result.user
  },

  logout: async () => {
    await authApi.logout().catch(() => undefined)
    await session.clear()
    set({ status: 'anonymous', user: null })
  },

  endSession: (reason) => {
    if (get().status !== 'authenticated') return
    void session.clear()
    set({ status: 'anonymous', user: null, endReason: reason })
  },

  setUser: (user) => set({ user }),

  clearEndReason: () => set({ endReason: null }),
}))

session.onExpired((reason) => useAuthStore.getState().endSession(reason))
