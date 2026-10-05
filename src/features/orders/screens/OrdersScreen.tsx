import { Link, router } from 'expo-router'
import { Package } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { notify } from '@/shared/feedback'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { ordersApi } from '../api/orders-api'
import { ordersTexts as t } from '../texts'
import type { Order, OrderStatus } from '../types'

/** Color del distintivo según el estado del pedido. */
function statusColor(status: OrderStatus, colors: ReturnType<typeof useColors>) {
  if (status === 'CANCELLED') return colors.destructive
  if (status === 'DELIVERED' || status === 'PAID') return colors.success
  if (status === 'PENDING_PAYMENT') return colors.warning
  return colors.primary
}

export function OrdersScreen() {
  const colors = useColors()
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    let alive = true
    ordersApi
      .mine()
      .then(({ items }) => {
        if (alive) setOrders(items)
      })
      .catch((error: unknown) => notify.fromError(error, t.loadError))
    return () => {
      alive = false
    }
  }, [])

  if (!orders) {
    return (
      <Screen centered>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    )
  }

  if (orders.length === 0) {
    return (
      <Screen centered>
        <View style={styles.empty}>
          <Package color={colors.mutedForeground} size={36} />
          <AppText variant="muted">{t.empty}</AppText>
          <Button
            label={t.emptyAction}
            variant="outline"
            fullWidth={false}
            onPress={() => router.push('/catalog')}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      {orders.map((order) => (
        <Link
          key={order.id}
          href={{ pathname: '/pedido/[number]', params: { number: order.number } }}
          asChild
        >
          <Pressable accessibilityRole="button" accessibilityLabel={t.orderNumber(order.number)}>
            <Card>
              <View style={styles.header}>
                <AppText variant="subtitle">{order.number}</AppText>
                <View style={[styles.badge, { backgroundColor: statusColor(order.status, colors) }]}>
                  <AppText style={{ fontSize: 12, fontWeight: '600', color: '#ffffff' }}>
                    {t.statuses[order.status]}
                  </AppText>
                </View>
              </View>
              <AppText variant="muted">{t.placedOn(formatDate(order.placedAt))}</AppText>
              <View style={styles.header}>
                <AppText variant="muted">{t.items(order.items.length)}</AppText>
                <AppText style={{ fontWeight: '600' }}>{formatPrice(order.totalCents)}</AppText>
              </View>
            </Card>
          </Pressable>
        </Link>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  empty: { alignItems: 'center', gap: spacing.lg },
})
