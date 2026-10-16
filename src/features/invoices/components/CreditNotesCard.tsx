import { Download } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { notify } from '@/shared/feedback'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { spacing } from '@/shared/theme/tokens'
import { creditNotesApi, type CreditNote } from '../api/invoices-api'
import { invoicesTexts as t } from '../texts'

/**
 * Facturas rectificativas del pedido.
 *
 * Casi nunca se ve, y así debe ser: solo hay rectificativa cuando se ha
 * devuelto dinero de un pedido ya facturado. Va aparte de la factura porque son
 * documentos distintos, cada uno con su número.
 */
export function CreditNotesCard({ orderNumber }: { orderNumber: string }) {
  const [notes, setNotes] = useState<CreditNote[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    creditNotesApi
      .forOrder(orderNumber)
      .then(({ items }) => {
        if (active) setNotes(items)
      })
      // Sin rectificativas no hay nada que enseñar ni de lo que avisar.
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [orderNumber])

  if (notes.length === 0) return null

  const share = async (number: string) => {
    setBusy(number)
    try {
      await creditNotesApi.share(number)
    } catch (error) {
      notify.fromError(error, t.rectifying.downloadError)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card title={t.rectifying.title}>
      <AppText variant="muted" style={{ fontSize: 13, lineHeight: 19 }}>
        {t.rectifying.help}
      </AppText>

      {notes.map((note) => (
        <View key={note.id} style={{ gap: spacing.sm }}>
          <View style={{ gap: 2 }}>
            <AppText style={{ fontWeight: '600' }}>
              {note.number} · {formatPrice(note.totalCents)}
            </AppText>
            <AppText variant="muted" style={{ fontSize: 13 }}>
              {t.rectifying.issuedOn(formatDate(note.issuedAt))} · {note.reason}
            </AppText>
          </View>
          <Button
            label={t.rectifying.share}
            icon={Download}
            variant="outline"
            loading={busy === note.number}
            onPress={() => void share(note.number)}
          />
        </View>
      ))}
    </Card>
  )
}
