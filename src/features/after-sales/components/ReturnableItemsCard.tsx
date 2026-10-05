import { RotateCcw } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { FeatureKey, useFeature } from '@/features/app-config'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { AppForm, yup, type FieldConfig } from '@/shared/forms'
import { notify } from '@/shared/feedback'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { spacing } from '@/shared/theme/tokens'
import { returnsApi } from '../api/after-sales-api'
import { afterSalesTexts as t } from '../texts'
import type { ReturnableItem, ReturnableOrder } from '../types'

interface RequestValues {
  qty: string
  reason: string
}

/** El máximo depende de la línea, así que el esquema se construye con ella. */
const schemaFor = (max: number): yup.ObjectSchema<RequestValues> =>
  yup.object({
    qty: yup
      .string()
      .trim()
      .required()
      .test('unidades', `Entre 1 y ${max}`, (value) => {
        const parsed = Number(value)
        return Number.isInteger(parsed) && parsed >= 1 && parsed <= max
      }),
    reason: yup.string().trim().min(3).max(500).required(),
  })

/** Por qué no se puede devolver esta línea, en palabras del cliente. */
function reasonNotReturnable(item: ReturnableItem, orderStatus: string) {
  if (item.returnableQty === 0) return t.alreadyReturned
  if (orderStatus !== 'SHIPPED' && orderStatus !== 'DELIVERED') return t.notDelivered
  return t.outOfWindow
}

/**
 * Qué se puede devolver de un pedido. Va en el detalle del pedido y solo
 * aparece si la feature de devoluciones está activa.
 */
export function ReturnableItemsCard({ orderNumber }: { orderNumber: string }) {
  const colors = useColors()
  const active = useFeature(FeatureKey.Returns)
  const [loaded, setLoaded] = useState<{ number: string; data: ReturnableOrder } | null>(null)
  const [version, setVersion] = useState(0)
  const [requesting, setRequesting] = useState<ReturnableItem | null>(null)

  useEffect(() => {
    if (!active) return
    let alive = true
    returnsApi
      .returnable(orderNumber)
      .then((data) => {
        if (alive) setLoaded({ number: orderNumber, data })
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [active, orderNumber, version])

  if (!active || loaded?.number !== orderNumber) return null

  if (requesting) {
    return (
      <Card title={t.requestTitle(requesting.nameSnapshot)} description={t.requestHint}>
        <AppForm<RequestValues>
          schema={schemaFor(requesting.returnableQty)}
          defaultValues={{ qty: String(requesting.returnableQty), reason: '' }}
          fields={
            [
              { kind: 'text', name: 'qty', label: t.fieldQty, keyboardType: 'number-pad' },
              { kind: 'text', name: 'reason', label: t.fieldReason },
            ] as FieldConfig<RequestValues>[]
          }
          submitLabel={t.send}
          onSubmit={async (values) => {
            await returnsApi.request(orderNumber, {
              orderItemId: requesting.orderItemId,
              qty: Number(values.qty),
              reason: values.reason,
            })
            notify.success(t.requested)
            setRequesting(null)
            setVersion((value) => value + 1)
          }}
        />
        <Button label={t.cancel} variant="ghost" onPress={() => setRequesting(null)} />
      </Card>
    )
  }

  const { items, status } = loaded.data
  const anyReturnable = items.some((item) => item.canRequest)

  return (
    <Card title={t.returnableTitle}>
      {!anyReturnable ? (
        <AppText variant="muted">{t.returnableEmpty}</AppText>
      ) : (
        items.map((item) => (
          <View key={item.orderItemId} style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '500' }}>{item.nameSnapshot}</AppText>
              <AppText variant="muted" style={{ fontSize: 13 }}>
                {item.variantSnapshot} · {formatPrice(item.unitPriceCents)}
              </AppText>
              {item.canRequest && item.deadline && (
                <AppText variant="muted" style={{ fontSize: 13 }}>
                  {t.deadline(formatDate(item.deadline))}
                </AppText>
              )}
            </View>

            {item.canRequest ? (
              <Button
                label={t.returnButton}
                variant="outline"
                icon={RotateCcw}
                fullWidth={false}
                onPress={() => setRequesting(item)}
              />
            ) : (
              <AppText variant="muted" style={{ fontSize: 13, color: colors.mutedForeground }}>
                {reasonNotReturnable(item, status)}
              </AppText>
            )}
          </View>
        ))
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
})
