/**
 * Implementación SOLO para Expo web (desarrollo/pruebas en navegador). La app móvil no se publica en web.
 * Guarda en memoria: nada persiste al recargar, así no se expone el refresh token en localStorage.
 * En iOS/Android Metro resuelve `secure-session.ts` (Keychain/Keystore).
 */
const memory = new Map<string, string>()
const KEYS = { refreshToken: 'session.refresh-token', deviceKey: 'device.private-key' } as const

export const secureSession = {
  getRefreshToken: async () => memory.get(KEYS.refreshToken) ?? null,
  setRefreshToken: async (token: string) => void memory.set(KEYS.refreshToken, token),
  clearRefreshToken: async () => void memory.delete(KEYS.refreshToken),
  getDeviceKey: async () => memory.get(KEYS.deviceKey) ?? null,
  setDeviceKey: async (hex: string) => void memory.set(KEYS.deviceKey, hex),
  async clearAll() {
    memory.clear()
  },
}
