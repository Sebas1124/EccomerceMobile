import { router, useFocusEffect } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useAuthStore } from '@/features/auth'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { spacing } from '@/shared/theme/tokens'
import { notificationsApi } from '../api/notifications-api'
import { notificationsTexts as t } from '../texts'

/** Campana de la cabecera, con el número de avisos sin leer. */
export function NotificationBellButton() {
  const colors = useColors()
  const authed = useAuthStore((s) => s.status === 'authenticated')
  const [unread, setUnread] = useState(0)

  // Se recuenta al volver a la pantalla: basta y no hace falta otro socket.
  useFocusEffect(
    useCallback(() => {
      if (!authed) return
      let alive = true
      notificationsApi
        .unread()
        .then(({ unread: count }) => {
          if (alive) setUnread(count)
        })
        .catch(() => undefined)
      return () => {
        alive = false
      }
    }, [authed]),
  )

  if (!authed) return null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.bell}
      hitSlop={8}
      onPress={() => router.push('/avisos')}
      style={({ pressed }) => [{ paddingHorizontal: spacing.sm }, pressed && { opacity: 0.6 }]}
    >
      <Bell size={22} color={colors.foreground} />
      {unread > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
          <AppText style={styles.badgeText}>{unread > 9 ? '9+' : String(unread)}</AppText>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
})
