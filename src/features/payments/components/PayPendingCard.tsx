import * as WebBrowser from 'expo-web-browser'
import { CreditCard } from 'lucide-react-native'
import { useState } from 'react'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { notify } from '@/shared/feedback'
import { formatPrice } from '@/shared/lib/format'
import { paymentsApi } from '../api/payments-api'
import { paymentsTexts as t } from '../texts'

/**
 * Pagar un pedido pendiente desde el móvil.
 *
 * El cobro ocurre en la pantalla de pago de la web, abierta en un navegador
 * dentro de la app. Dos motivos:
 *
 * 1. **Sigue funcionando en Expo Go.** El SDK nativo de Stripe obliga a un
 *    development build, y eso cambia cómo se prueba la app para todo el mundo.
 * 2. **Es la misma pantalla de pago**, con sus animaciones y su 3DS, en vez de
 *    una segunda implementación que se quedaría atrás a la primera.
 *
 * El navegador no lleva la sesión de la app, así que el servidor emite un
 * enlace que vale media hora y **solo** para ver el importe de ese pedido y
 * arrancar su cobro.
 */
export function PayPendingCard({
  orderNumber,
  amountCents,
  onReturn,
}: {
  orderNumber: string
  amountCents: number
  /** Al volver del navegador: el estado real lo marca el webhook. */
  onReturn: () => void
}) {
  const colors = useColors()
  const [busy, setBusy] = useState(false)

  const pay = async () => {
    setBusy(true)
    try {
      const { url } = await paymentsApi.issueLink(orderNumber)
      // `openBrowserAsync` vuelve aquí cuando se cierra la pestaña, que es
      // justo el momento de volver a pedir el pedido.
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: colors.background,
        controlsColor: colors.primary,
      })
      onReturn()
    } catch (error) {
      notify.fromError(error, t.payError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title={t.pendingTitle} description={t.pendingHint}>
      <Button
        label={t.payNow(formatPrice(amountCents))}
        icon={CreditCard}
        loading={busy}
        haptic="success"
        onPress={() => void pay()}
      />
      <AppText variant="muted" style={{ fontSize: 12 }}>
        {t.opensBrowser}
      </AppText>
    </Card>
  )
}
