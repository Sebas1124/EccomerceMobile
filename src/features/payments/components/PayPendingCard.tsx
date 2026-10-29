import * as WebBrowser from 'expo-web-browser'
import { CreditCard, Wallet } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { notify } from '@/shared/feedback'
import { formatPrice } from '@/shared/lib/format'
import { paymentsApi, type SavedMethod } from '../api/payments-api'
import { paymentsTexts as t } from '../texts'

/** Una tarjeta caducada no se ofrece: el banco la va a rechazar. */
function expired(value?: string) {
  if (!value) return false
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return false
  return new Date(year, month, 1) <= new Date()
}

/**
 * Pagar un pedido pendiente desde el móvil.
 *
 * Con una forma de pago guardada se cobra **sin salir de la app**: el servidor
 * crea y confirma el cobro con ese método, tras comprobar que es de quien
 * dice. Si el banco quiere confirmación (3DS), se termina en el navegador, que
 * es donde vive la pantalla que sabe hacerlo.
 *
 * Sin nada guardado —o eligiendo otra forma— se abre la pantalla de pago de la
 * web en un navegador dentro de la app. Dos motivos:
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
  const [saved, setSaved] = useState<SavedMethod[]>([])

  useEffect(() => {
    let alive = true
    paymentsApi
      .methods()
      .then(({ items }) => {
        if (alive) setSaved(items.filter((item) => !expired(item.expiresAt)))
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  /** Abre la pantalla de pago de la web. Es el camino de siempre. */
  const payInBrowser = async () => {
    const { url } = await paymentsApi.issueLink(orderNumber)
    // `openBrowserAsync` vuelve aquí cuando se cierra la pestaña, que es justo
    // el momento de volver a pedir el pedido.
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: colors.background,
      controlsColor: colors.primary,
    })
    onReturn()
  }

  const pay = async () => {
    setBusy(true)
    try {
      await payInBrowser()
    } catch (error) {
      notify.fromError(error, t.payError)
    } finally {
      setBusy(false)
    }
  }

  const payWithSaved = async (method: SavedMethod) => {
    setBusy(true)
    try {
      const { status } = await paymentsApi.payWithSaved(
        orderNumber,
        method.providerId,
        method.token,
      )

      if (status === 'succeeded' || status === 'processing') {
        notify.success(t.paidOk)
        onReturn()
        return
      }

      // Hace falta 3DS o algo que aquí no se puede resolver: se termina en el
      // navegador, donde está la pantalla que sabe confirmarlo.
      notify.info(t.needsBrowser)
      await payInBrowser()
    } catch (error) {
      notify.fromError(error, t.payError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title={t.pendingTitle} description={t.pendingHint}>
      {saved.map((method) => (
        <Button
          key={method.token}
          label={t.payWith(method.label)}
          icon={method.kind === 'card' ? CreditCard : Wallet}
          variant={method.isDefault ? 'primary' : 'outline'}
          loading={busy}
          haptic="success"
          onPress={() => void payWithSaved(method)}
        />
      ))}

      {saved.length > 0 && (
        <AppText variant="muted" style={{ fontSize: 12 }}>
          {t.payWithHint}
        </AppText>
      )}

      <Button
        label={saved.length > 0 ? t.payOther : t.payNow(formatPrice(amountCents))}
        icon={CreditCard}
        variant={saved.length > 0 ? 'ghost' : 'primary'}
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
