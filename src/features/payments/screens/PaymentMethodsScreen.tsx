import * as WebBrowser from 'expo-web-browser'
import { CreditCard, Plus, Star, Trash2, Wallet } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, notify } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import { paymentsApi, type SavedMethod } from '../api/payments-api'
import { paymentsTexts as t } from '../texts'

/** "2029-04" → "04/2029". La pasarela lo manda al revés de como se lee. */
const expiry = (value: string) => {
  const [year, month] = value.split('-')
  return month && year ? `${month}/${year}` : value
}

/** Una caducada se enseña avisada: ya no va a cobrar. */
const isExpired = (value?: string) => {
  if (!value) return false
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return false
  return new Date(year, month, 1) <= new Date()
}

/**
 * Formas de pago guardadas.
 *
 * El alta no se hace aquí: el formulario es de la pasarela y meterlo en la app
 * obligaría a un development build —adiós Expo Go— o a que los datos de la
 * tarjeta pasen por nuestro código, que es justo lo que no se quiere. Se abre
 * un enlace de un solo uso en el navegador, como ya hace el pago.
 */
export function PaymentMethodsScreen() {
  const colors = useColors()
  const [items, setItems] = useState<SavedMethod[] | null>(null)
  const [providers, setProviders] = useState<string[]>([])
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    paymentsApi
      .methods()
      .then(({ items: loaded, providers: available }) => {
        if (!alive) return
        setItems(loaded)
        setProviders(available)
      })
      .catch((error: unknown) => notify.fromError(error, t.saved.loadError))
    return () => {
      alive = false
    }
  }, [version])

  const reload = () => setVersion((value) => value + 1)

  const add = async () => {
    setBusy(true)
    try {
      const { url } = await paymentsApi.issueSetupLink()
      // Vuelve aquí al cerrar la pestaña, que es el momento de recargar.
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: colors.background,
        controlsColor: colors.primary,
      })
      reload()
    } catch (error) {
      notify.fromError(error, t.saved.addError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.saved.title}</AppText>
        <AppText variant="muted">{t.saved.subtitle}</AppText>
      </View>

      {providers.length > 0 ? (
        <>
          <Button label={t.saved.add} icon={Plus} loading={busy} haptic="selection" onPress={() => void add()} />
          <AppText variant="muted" style={{ fontSize: 12 }}>
            {t.saved.addHint}
          </AppText>
        </>
      ) : (
        items !== null && (
          <Card>
            <AppText variant="muted">{t.saved.unavailable}</AppText>
          </Card>
        )
      )}

      {items?.length === 0 && providers.length > 0 && (
        <Card>
          <View style={styles.empty}>
            <CreditCard color={colors.mutedForeground} size={32} />
            <AppText variant="muted">{t.saved.empty}</AppText>
          </View>
        </Card>
      )}

      {items?.map((method) => {
        const expired = isExpired(method.expiresAt)
        return (
          <Card key={method.token}>
            <View style={styles.row}>
              {method.kind === 'card' ? (
                <CreditCard color={colors.foreground} size={20} />
              ) : (
                <Wallet color={colors.foreground} size={20} />
              )}
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                  {method.label}
                </AppText>
                {method.expiresAt && (
                  <AppText
                    variant="muted"
                    style={{ fontSize: 12, color: expired ? colors.destructive : undefined }}
                  >
                    {expired ? t.saved.expired : t.saved.expires(expiry(method.expiresAt))}
                  </AppText>
                )}
              </View>
              {method.isDefault && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <AppText style={{ fontSize: 12, color: colors.primaryForeground }}>
                    {t.saved.default}
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              {!method.isDefault && !expired && (
                <Button
                  label={t.saved.setDefault}
                  variant="outline"
                  icon={Star}
                  fullWidth={false}
                  haptic="selection"
                  onPress={() => {
                    void paymentsApi.setDefaultMethod(method.token, method.providerId).then(() => {
                      notify.success(t.saved.defaultSet)
                      reload()
                    })
                  }}
                />
              )}
              <Button
                label={t.saved.remove}
                variant="ghost"
                icon={Trash2}
                fullWidth={false}
                onPress={() =>
                  void confirm({
                    title: t.saved.removeTitle,
                    description: t.saved.removeConfirm,
                    tone: 'danger',
                    confirmLabel: t.saved.remove,
                    action: async () => {
                      await paymentsApi.removeMethod(method.token, method.providerId)
                      notify.success(t.saved.removed)
                      reload()
                    },
                  })
                }
              />
            </View>
          </Card>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
})
