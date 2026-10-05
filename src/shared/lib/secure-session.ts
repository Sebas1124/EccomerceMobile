import * as SecureStore from 'expo-secure-store'

/**
 * Almacenamiento cifrado de la sesión (Keychain en iOS / Keystore en Android).
 * Aquí viven el refresh token y la clave privada del dispositivo; nunca en AsyncStorage.
 */
const KEYS = {
  refreshToken: 'session.refresh-token',
  deviceKey: 'device.private-key',
} as const

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
}

export const secureSession = {
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.refreshToken, options),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(KEYS.refreshToken, token, options),
  clearRefreshToken: () => SecureStore.deleteItemAsync(KEYS.refreshToken, options),

  getDeviceKey: () => SecureStore.getItemAsync(KEYS.deviceKey, options),
  setDeviceKey: (hex: string) => SecureStore.setItemAsync(KEYS.deviceKey, hex, options),

  async clearAll() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.refreshToken, options),
      SecureStore.deleteItemAsync(KEYS.deviceKey, options),
    ])
  },
}
