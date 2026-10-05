import { Download } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { notify } from '@/shared/feedback'
import { ApiError } from '@/shared/lib/api-client'
import { formatDate } from '@/shared/lib/format'
import { spacing } from '@/shared/theme/tokens'
import { invoicesApi, type Invoice } from '../api/invoices-api'
import { invoicesTexts as t } from '../texts'

/**
 * Factura del pedido. Si todavía no está emitida no se enseña nada: ofrecer
 * una descarga que va a fallar es peor que no ofrecer ninguna.
 */
export function InvoiceCard({ orderNumber }: { orderNumber: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    invoicesApi
      .forOrder(orderNumber)
      .then(({ invoice: loaded }) => active && setInvoice(loaded))
      .catch((error: unknown) => {
        // 404 es lo normal mientras el pedido no está facturado.
        if (active && !(error instanceof ApiError && error.status === 404)) {
          notify.fromError(error, t.loadError)
        }
      })
    return () => {
      active = false
    }
  }, [orderNumber])

  if (!invoice) return null

  const share = async () => {
    setBusy(true)
    try {
      await invoicesApi.share(orderNumber, invoice.number)
    } catch (error) {
      notify.fromError(error, t.downloadError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title={t.title}>
      <View style={{ gap: spacing.xs }}>
        <AppText style={{ fontWeight: '600' }}>{invoice.number}</AppText>
        <AppText variant="muted" style={{ fontSize: 13 }}>
          {t.issuedOn(formatDate(invoice.issuedAt))}
        </AppText>
      </View>
      <Button
        label={t.download}
        icon={Download}
        variant="outline"
        loading={busy}
        onPress={() => void share()}
      />
    </Card>
  )
}
