import { PackageOpen, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, notify } from '@/shared/feedback'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { returnsApi } from '../api/after-sales-api'
import { afterSalesTexts as t } from '../texts'
import type { ReturnRequest, ReturnStatus } from '../types'

/** Solo se puede retirar mientras la tienda no la haya recibido. */
const CANCELLABLE: ReturnStatus[] = ['REQUESTED', 'APPROVED']

export function MyReturnsScreen() {
  const colors = useColors()
  const [items, setItems] = useState<ReturnRequest[] | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true
    returnsApi
      .mine()
      .then(({ items: loaded }) => {
        if (alive) setItems(loaded)
      })
      .catch((error: unknown) => notify.fromError(error, t.loadError))
    return () => {
      alive = false
    }
  }, [version])

  const cancel = (request: ReturnRequest) =>
    confirm({
      title: t.cancelReturnTitle,
      description: t.cancelReturnConfirm,
      tone: 'danger',
      confirmLabel: t.cancelReturn,
      action: async () => {
        await returnsApi.cancel(request.id)
        notify.success(t.returnCancelled)
        setVersion((value) => value + 1)
      },
    })

  if (!items) {
    return (
      <Screen centered>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    )
  }

  if (items.length === 0) {
    return (
      <Screen centered>
        <View style={styles.empty}>
          <PackageOpen color={colors.mutedForeground} size={36} />
          <AppText variant="muted">{t.empty}</AppText>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.title}</AppText>
        <AppText variant="muted">{t.subtitle}</AppText>
      </View>

      {items.map((request) => (
        <Card key={request.id}>
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <AppText style={{ fontSize: 12 }}>{t.statuses[request.status]}</AppText>
            </View>
            <AppText variant="muted">
              {request.order.number} · {formatDate(request.createdAt)}
            </AppText>
          </View>

          <View>
            <AppText style={{ fontWeight: '500' }}>{request.orderItem.nameSnapshot}</AppText>
            <AppText variant="muted">
              {request.orderItem.variantSnapshot} · {t.units(request.qty)}
            </AppText>
          </View>

          <AppText variant="muted" style={{ fontStyle: 'italic' }}>
            {request.reason}
          </AppText>

          {request.adminNote && (
            <AppText variant="muted">
              {t.adminNote}: {request.adminNote}
            </AppText>
          )}

          {request.refundedCents > 0 && (
            <AppText style={{ color: colors.primary }}>
              {t.refunded(formatPrice(request.refundedCents))}
            </AppText>
          )}

          {CANCELLABLE.includes(request.status) && (
            <Button
              label={t.cancelReturn}
              variant="ghost"
              icon={X}
              fullWidth={false}
              onPress={() => void cancel(request)}
            />
          )}
        </Card>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  empty: { alignItems: 'center', gap: spacing.lg },
})
