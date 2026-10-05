import { Stack, router, useFocusEffect } from 'expo-router'
import type { Href } from 'expo-router'
import {
  Bell,
  CheckCheck,
  Headset,
  Megaphone,
  MessagesSquare,
  Package,
  ShoppingBag,
  Sparkles,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { haptics, notify } from '@/shared/feedback'
import { formatDate } from '@/shared/lib/format'
import { spacing } from '@/shared/theme/tokens'
import {
  notificationsApi,
  type AppNotification,
  type NotificationKind,
} from '../api/notifications-api'
import { notificationsTexts as t } from '../texts'

const kindIcon: Record<NotificationKind, LucideIcon> = {
  ORDER: ShoppingBag,
  PROMOTION: Megaphone,
  PRODUCT: Package,
  SYSTEM: Sparkles,
  TICKET: Headset,
  CHAT: MessagesSquare,
}

/** Buzón de avisos del cliente. */
export function NotificationsScreen() {
  const colors = useColors()
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const [unread, setUnread] = useState(0)

  const load = useCallback(() => {
    let alive = true
    notificationsApi
      .mine()
      .then(({ items: rows, unread: count }) => {
        if (!alive) return
        setItems(rows)
        setUnread(count)
      })
      .catch((error: unknown) => {
        if (!alive) return
        setItems([])
        notify.fromError(error, t.loadError)
      })
    return () => {
      alive = false
    }
  }, [])

  // Al volver de una pantalla abierta desde un aviso, la lista se refresca.
  useFocusEffect(load)

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead()
      setItems((rows) => (rows ?? []).map((row) => ({ ...row, read: true })))
      setUnread(0)
      notify.success(t.allRead)
    } catch (error) {
      notify.fromError(error)
    }
  }

  const open = async (item: AppNotification) => {
    void haptics.trigger('selection')
    // Solo los dirigidos se marcan uno a uno; las difusiones van con el resto.
    if (!item.read && item.userId) {
      await notificationsApi.markRead(item.id).catch(() => undefined)
      setItems((rows) =>
        (rows ?? []).map((row) => (row.id === item.id ? { ...row, read: true } : row)),
      )
      setUnread((count) => Math.max(0, count - 1))
    }
    if (item.route) router.push(item.route as Href)
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.bell }} />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.bell}</AppText>
        {unread > 0 && <AppText variant="muted">{`${unread} sin leer`}</AppText>}
      </View>

      {unread > 0 && (
        <Button label={t.markAllRead} icon={CheckCheck} variant="outline" onPress={() => void markAll()} />
      )}

      {items === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
            <Bell size={28} color={colors.mutedForeground} />
            <AppText variant="muted">{t.bellEmpty}</AppText>
          </View>
        </Card>
      ) : (
        <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
          {items.map((item, index) => {
            const Icon = kindIcon[item.kind]
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => void open(item)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Icon size={18} color={item.read ? colors.mutedForeground : colors.primary} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText style={{ fontWeight: item.read ? '400' : '600' }} numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="muted" style={{ fontSize: 13 }} numberOfLines={2}>
                    {item.body}
                  </AppText>
                  <AppText variant="muted" style={{ fontSize: 11 }}>
                    {formatDate(item.createdAt)}
                  </AppText>
                </View>
                {!item.read && (
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            )
          })}
        </Card>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
})
