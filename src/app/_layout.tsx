import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { AppState, View } from 'react-native'
import { useAppConfigStore } from '@/features/app-config'
import { useAuthStore, watchRevokedSessions } from '@/features/auth'
import { usePushNotifications } from '@/features/notifications'
import { ThemeOverlay, useColors, useThemeStore } from '@/features/theme'
import { ConfirmDialogHost, SnackbarHost, useHapticsStore } from '@/shared/feedback'
import { AppDrawer } from '@/shared/navigation'

// Arranque: tema guardado, configuración pública y sesión (SecureStore) en paralelo.
void useThemeStore.getState().hydrate()
void useHapticsStore.getState().hydrate()
void useAppConfigStore.getState().load()
void useAuthStore.getState().bootstrap()
// Si cierran esta sesión desde otro dispositivo, se sabe por socket al instante.
watchRevokedSessions()

/**
 * Layout raíz. Sin providers de React: el estado global vive en stores de zustand y los
 * componentes globales (snackbars, diálogo de confirmación, overlay de tema) se montan aquí una vez.
 */
export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme)
  const defaultTheme = useAppConfigStore((s) => s.config.branding.defaultTheme)
  const colors = useColors()

  // Registra el móvil al iniciar sesión y abre la pantalla del aviso al tocarlo.
  usePushNotifications()

  useEffect(() => useThemeStore.getState().applyDefault(defaultTheme), [defaultTheme])

  useEffect(() => {
    // Refresca branding y features al volver a primer plano (el superadmin pudo cambiarlos).
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void useAppConfigStore.getState().load()
    })
    return () => sub.remove()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: '' }} />
        <Stack.Screen name="register" options={{ title: '' }} />
        <Stack.Screen name="verify-email" options={{ title: '' }} />
        <Stack.Screen name="forgot-password" options={{ title: '' }} />
      </Stack>
      <AppDrawer />
      <SnackbarHost />
      <ConfirmDialogHost />
      <ThemeOverlay />
    </View>
  )
}
