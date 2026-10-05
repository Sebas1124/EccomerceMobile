import { Info, Share2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { FeatureKey, useFeature } from '@/features/app-config'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { notify } from '@/shared/feedback'
import { ApiError } from '@/shared/lib/api-client'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { receiptsApi, type Receipt } from '../api/receipts-api'
import { receiptsTexts as t } from '../texts'

/**
 * Recibo de un pedido con pago manual.
 *
 * Aquí la hoja de compartir adjunta el PDF de verdad, que es lo que no se puede
 * hacer desde la web: un enlace `wa.me` solo admite texto.
 */
export function ReceiptCard({ orderNumber }: { orderNumber: string }) {
  const enabled = useFeature(FeatureKey.ManualPayments)
  const colors = useColors()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    receiptsApi
      .forOrder(orderNumber)
      .then(({ receipt: loaded }) => {
        if (alive) setReceipt(loaded)
      })
      .catch((error: unknown) => {
        // 404 es lo normal: ese pedido no se pagó a mano.
        if (alive && !(error instanceof ApiError && error.status === 404)) {
          notify.fromError(error, t.loadError)
        }
      })
    return () => {
      alive = false
    }
  }, [orderNumber, enabled])

  if (!enabled || !receipt) return null

  const share = async () => {
    setBusy(true)
    try {
      await receiptsApi.share(orderNumber, receipt.number)
    } catch (error) {
      notify.fromError(error, t.shareError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title={t.title}>
      {/* Lo primero: que esto no es una factura. */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          backgroundColor: colors.muted,
          borderRadius: radius.lg,
          padding: spacing.md,
        }}
      >
        <Info size={16} color={colors.mutedForeground} />
        <AppText variant="muted" style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>
          {t.notAnInvoice}
        </AppText>
      </View>

      <View style={{ gap: spacing.xs }}>
        <AppText style={{ fontWeight: '600' }}>{receipt.number}</AppText>
        <AppText variant="muted" style={{ fontSize: 13 }}>
          {t.issuedOn(formatDate(receipt.issuedAt))} · {formatPrice(receipt.totalCents)}
        </AppText>
      </View>

      {receipt.instructions ? (
        <View style={{ gap: 2 }}>
          <AppText style={{ fontWeight: '600', fontSize: 13 }}>{t.howToPay}</AppText>
          <AppText variant="muted" style={{ fontSize: 13, lineHeight: 19 }}>
            {receipt.instructions}
          </AppText>
        </View>
      ) : null}

      <Button
        label={t.share}
        icon={Share2}
        loading={busy}
        haptic="success"
        onPress={() => void share()}
      />

      <AppText variant="muted" style={{ fontSize: 12 }}>
        {t.nextStep}
      </AppText>
    </Card>
  )
}
