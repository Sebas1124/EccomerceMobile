import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { api } from '@/shared/lib/api-client'
import { secureSession } from '@/shared/lib/secure-session'
import type { Device, RegisterValues, User } from '../types'

type Message = { message: string }
type Session = { accessToken: string; refreshToken: string; user: User }

/** El login devuelve la sesión o un challenge si la cuenta tiene doble factor. */
export type LoginResponse = Session | { requires2fa: true; challengeId: string }

const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web'
const deviceName = () =>
  Constants.deviceName ?? (platform === 'ios' ? 'iPhone' : platform === 'android' ? 'Android' : 'Navegador')

export const authApi = {
  register: ({ firstName, lastName, email, password, acceptTerms }: RegisterValues) =>
    api.post<Message>(
      '/auth/register',
      { firstName, lastName, email, password, acceptTerms },
      { auth: false },
    ),

  verifyEmail: (email: string, code: string) =>
    api.post<{ verified: boolean }>('/auth/verify-email', { email, code }, { auth: false }),

  resendVerification: (email: string) =>
    api.post<Message>('/auth/resend-verification', { email }, { auth: false }),

  /** En móvil el dispositivo siempre es de confianza: la sesión vive cifrada en SecureStore. */
  login: (email: string, password: string) =>
    api.post<LoginResponse>(
      '/auth/login',
      { email, password, trustDevice: true, deviceName: deviceName(), platform, client: 'mobile' },
      { auth: false, dpop: true },
    ),

  async logout() {
    const refreshToken = await secureSession.getRefreshToken()
    if (!refreshToken) return
    await api.post<void>('/auth/logout', undefined, {
      auth: false,
      headers: { 'X-Refresh-Token': refreshToken },
    })
  },

  me: () => api.get<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) => api.post<Message>('/auth/password/forgot', { email }, { auth: false }),

  verifyResetCode: (email: string, code: string) =>
    api.post<{ resetToken: string }>('/auth/password/verify', { email, code }, { auth: false }),

  resetPassword: (resetToken: string, password: string) =>
    api.post<Message>('/auth/password/reset', { resetToken, password }, { auth: false }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<Message>('/me/password', { currentPassword, newPassword }),

  verifyTwoFactor: (challengeId: string, code: string) =>
    api.post<Session>(
      '/auth/2fa/verify',
      { challengeId, code, client: 'mobile' },
      { auth: false, dpop: true },
    ),

  twoFactorStatus: () => api.get<{ enabled: boolean; remainingRecoveryCodes: number }>('/me/2fa'),

  twoFactorSetup: () => api.post<{ secret: string; otpauthUrl: string; qrDataUrl: string }>('/me/2fa/setup'),

  twoFactorEnable: (code: string) =>
    api.post<{ enabled: true; recoveryCodes: string[] }>('/me/2fa/enable', { code }),

  twoFactorDisable: (password: string, code: string) =>
    api.post<{ enabled: false }>('/me/2fa/disable', { password, code }),

  devices: () => api.get<{ items: Device[] }>('/me/devices'),

  revokeDevice: (id: string) => api.delete<void>(`/me/devices/${id}`),
}
