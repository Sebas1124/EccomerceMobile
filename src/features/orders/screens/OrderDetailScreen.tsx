import { Stack, useLocalSearchParams } from 'expo-router'
import { Ban, Truck } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { ReturnableItemsCard } from '@/features/after-sales'
import { FeatureKey, useFeature } from '@/features/app-config'
import { InvoiceCard } from '@/features/invoices'
import { ReceiptCard } from '@/features/receipts'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, notify } from '@/shared/feedback'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { ordersApi } from '../api/orders-api'
import { ordersTexts as t } from '../texts'
import type { Order } from '../types'

/** Estados desde los que el cliente todavía puede cancelar. */
const CANCELLABLE = ['PENDING_PAYMENT', 'PAID']

export function OrderDetailScreen() {
  const colors = useColors()
  const { number } = useLocalSearchParams<{ number: string }>()
  const shippingOn = useFeature(FeatureKey.Shipping)
  const [order, setOrder] = useState<Order | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!number) return
    let alive = true
    ordersApi
      .get(number)
      .then(({ order: loaded }) => {
        if (alive) setOrder(loaded)
      })
      .catch((error: unknown) => notify.fromError(error, t.detailError))
    return () => {
      alive = false
    }
  }, [number, version])

  const cancel = () =>
    confirm({
      title: t.cancelTitle(number ?? ''),
      description: t.cancelConfirm,
      tone: 'danger',
      confirmLabel: t.cancel,
      action: async () => {
        await ordersApi.cancel(number!)
        notify.success(t.cancelled(number!))
        setVersion((value) => value + 1)
      },
    })

  if (!order) {
    return (
      <Screen centered>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    )
  }

  const shipment = order.shipments?.[0] ?? null

  return (
    <>
      <Stack.Screen options={{ title: t.orderNumber(order.number) }} />
      <Screen>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="title">{t.orderNumber(order.number)}</AppText>
          <AppText variant="muted">{t.placedOn(formatDate(order.placedAt))}</AppText>
        </View>

        {order.status === 'PENDING_PAYMENT' && (
          <View style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <AppText variant="muted">{t.paymentPending}</AppText>
          </View>
        )}

        <ReceiptCard orderNumber={order.number} />

        <InvoiceCard orderNumber={order.number} />

        <Card title={t.product}>
          {order.items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '500' }}>{item.nameSnapshot}</AppText>
                <AppText variant="muted" style={{ fontSize: 13 }}>
                  {item.variantSnapshot} · {t.quantity}: {item.qty} · {t.unitPrice}:{' '}
                  {formatPrice(item.unitPriceCents)}
                </AppText>
              </View>
              <AppText style={{ fontWeight: '600' }}>{formatPrice(item.lineTotalCents)}</AppText>
            </View>
          ))}
        </Card>

        <Card title={t.total}>
          <View style={styles.row}>
            <AppText variant="muted">{t.subtotal}</AppText>
            <AppText>{formatPrice(order.subtotalCents)}</AppText>
          </View>
          {order.discountCents > 0 && (
            <View style={styles.row}>
              <AppText style={{ color: colors.primary }}>{t.discounts}</AppText>
              <AppText style={{ color: colors.primary }}>
                -{formatPrice(order.discountCents)}
              </AppText>
            </View>
          )}
          {order.shippingCents > 0 && (
            <View style={styles.row}>
              <AppText variant="muted">{t.shipping}</AppText>
              <AppText>{formatPrice(order.shippingCents)}</AppText>
            </View>
          )}
          {order.taxBreakdown.map((tax) => (
            <View key={tax.rate} style={styles.row}>
              <AppText variant="muted">{t.tax(tax.rate)}</AppText>
              <AppText>{formatPrice(tax.taxCents)}</AppText>
            </View>
          ))}
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
            <AppText variant="subtitle">{t.total}</AppText>
            <AppText variant="subtitle">{formatPrice(order.totalCents)}</AppText>
          </View>
          <AppText variant="muted" style={{ fontSize: 12 }}>
            {t.invoiceNote}
          </AppText>
        </Card>

        <Card title={t.timeline}>
          {order.history.map((change) => (
            <View key={change.id} style={styles.event}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '500' }}>{t.statuses[change.to]}</AppText>
                <AppText variant="muted" style={{ fontSize: 13 }}>
                  {formatDate(change.createdAt)}
                </AppText>
                {change.note && <AppText variant="muted">{change.note}</AppText>}
              </View>
            </View>
          ))}
        </Card>

        {order.shippingAddress && (
          <Card title={t.shippingTo}>
            <AppText style={{ fontWeight: '500' }}>{order.shippingAddress.fullName}</AppText>
            <AppText variant="muted">{order.shippingAddress.street}</AppText>
            <AppText variant="muted">
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
            </AppText>
            <AppText variant="muted">{order.shippingAddress.country}</AppText>
          </Card>
        )}

        {shippingOn && order.shippingAddress && (
          <Card title={t.shipment}>
            {shipment ? (
              <>
                <View style={styles.row}>
                  <Truck color={colors.primary} size={18} />
                  <AppText style={{ flex: 1 }}>{shipment.providerId}</AppText>
                </View>
                <AppText variant="muted">
                  {t.tracking}: {shipment.trackingNumber}
                </AppText>
              </>
            ) : (
              <AppText variant="muted">{t.noShipment}</AppText>
            )}
          </Card>
        )}

        <ReturnableItemsCard orderNumber={order.number} />

        {CANCELLABLE.includes(order.status) && (
          <Button label={t.cancel} variant="outline" icon={Ban} onPress={() => void cancel()} />
        )}
      </Screen>
    </>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  event: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: radius.full, marginTop: 6 },
  notice: { padding: spacing.md, borderWidth: 1, borderRadius: radius.lg },
})
