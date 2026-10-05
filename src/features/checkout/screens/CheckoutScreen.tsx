import { router } from 'expo-router'
import { Clock, ShieldCheck, Tag, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { FeatureKey, useFeature } from '@/features/app-config'
import { useCartStore } from '@/features/cart'
import { ordersApi } from '@/features/orders'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { AppForm, yup, type FieldConfig } from '@/shared/forms'
import { confirm, notify } from '@/shared/feedback'
import { formatCountdown, formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { checkoutApi } from '../api/checkout-api'
import { checkoutTexts as t } from '../texts'
import type { AddressValues, CheckoutSession } from '../types'

const schema: yup.ObjectSchema<AddressValues> = yup.object({
  fullName: yup.string().trim().min(3).max(120).required(),
  street: yup.string().trim().min(3).max(160).required(),
  postalCode: yup.string().trim().min(3).max(12).required(),
  city: yup.string().trim().min(2).max(80).required(),
  province: yup.string().trim().max(80).defined(),
  phone: yup.string().trim().max(30).defined(),
  notes: yup.string().trim().max(300).defined(),
})

const fields: FieldConfig<AddressValues>[] = [
  { kind: 'text', name: 'fullName', label: t.fieldFullName, autoComplete: 'name' },
  { kind: 'text', name: 'street', label: t.fieldStreet, autoComplete: 'street-address' },
  { kind: 'text', name: 'postalCode', label: t.fieldPostalCode, keyboardType: 'number-pad' },
  { kind: 'text', name: 'city', label: t.fieldCity },
  { kind: 'text', name: 'province', label: t.fieldProvince },
  { kind: 'text', name: 'phone', label: t.fieldPhone, keyboardType: 'phone-pad' },
  { kind: 'text', name: 'notes', label: t.fieldNotes },
]

/** Campo de cupón: aplicar y quitar los resuelve el servidor. */
function PromoCodeField({
  session,
  onChange,
}: {
  session: CheckoutSession
  onChange: (session: CheckoutSession) => void
}) {
  const colors = useColors()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const apply = async () => {
    const value = code.trim()
    if (!value) return
    setBusy(true)
    try {
      const { session: updated } = await checkoutApi.applyPromoCode(session.id, value)
      onChange(updated)
      notify.success(t.promoApplied(value.toUpperCase()))
      setCode('')
    } catch (error) {
      notify.fromError(error)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      const { session: updated } = await checkoutApi.removePromoCode(session.id)
      onChange(updated)
      notify.success(t.promoRemoved)
    } catch (error) {
      notify.fromError(error)
    } finally {
      setBusy(false)
    }
  }

  if (session.promoCode) {
    return (
      <View style={[styles.promoApplied, { borderColor: colors.primary }]}>
        <Tag color={colors.primary} size={16} />
        <AppText style={{ flex: 1, fontWeight: '500' }}>{session.promoCode.code}</AppText>
        <Button
          label={t.promoRemove}
          variant="ghost"
          icon={X}
          fullWidth={false}
          disabled={busy}
          onPress={() => void remove()}
        />
      </View>
    )
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label">{t.promoLabel}</AppText>
      <View style={styles.promoRow}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder={t.promoPlaceholder}
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="characters"
          autoCorrect={false}
          style={[
            styles.promoInput,
            { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          ]}
          accessibilityLabel={t.promoLabel}
        />
        <Button
          label={t.promoApply}
          variant="outline"
          fullWidth={false}
          disabled={busy || code.trim().length < 2}
          onPress={() => void apply()}
        />
      </View>
    </View>
  )
}

export function CheckoutScreen() {
  const colors = useColors()
  const promoCodesOn = useFeature(FeatureKey.PromoCodes)
  const load = useCartStore((state) => state.load)
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [placing, setPlacing] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    // Abrir el checkout reserva stock: una sola vez por pantalla.
    if (started.current) return
    started.current = true
    checkoutApi
      .start()
      .then(({ session: opened }) => {
        setSession(opened)
        setSeconds(opened.secondsLeft)
      })
      .catch((error: unknown) => {
        notify.fromError(error, t.startError)
        router.back()
      })
  }, [])

  // Cuenta atrás de la reserva.
  useEffect(() => {
    if (!session || session.status !== 'PENDING') return
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(timer)
  }, [session])

  const saveAddress = async (values: AddressValues) => {
    if (!session) return
    const { session: updated } = await checkoutApi.setAddress(session.id, {
      fullName: values.fullName,
      street: values.street,
      city: values.city,
      postalCode: values.postalCode,
      province: values.province || null,
      country: 'España',
      phone: values.phone || null,
      notes: values.notes || null,
    })
    setSession(updated)
    notify.success(t.addressSaved)
  }

  const placeOrder = async () => {
    if (!session) return
    if (!session.shippingAddress) {
      notify.warning(t.needAddress)
      return
    }
    setPlacing(true)
    try {
      const { order } = await ordersApi.create(session.id)
      notify.success(t.placed(order.number))
      await load(true)
      router.replace({ pathname: '/pedido/[number]', params: { number: order.number } })
    } catch (error) {
      notify.fromError(error, t.placeError)
    } finally {
      setPlacing(false)
    }
  }

  const cancel = () =>
    confirm({
      title: t.cancelTitle,
      description: t.cancelConfirm,
      tone: 'danger',
      confirmLabel: t.cancel,
      action: async () => {
        if (session) await checkoutApi.cancel(session.id)
        notify.success(t.cancelled)
        router.replace('/cart')
      },
    })

  if (!session) {
    return (
      <Screen centered>
        <AppText variant="muted">{t.title}</AppText>
      </Screen>
    )
  }

  const expired = seconds <= 0 || session.status !== 'PENDING'

  if (expired) {
    return (
      <Screen centered>
        <Card title={t.title} description={t.expired}>
          <Button label={t.expiredAction} onPress={() => router.replace('/cart')} />
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={[styles.timer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Clock color={colors.primary} size={16} />
        <AppText style={{ fontSize: 14 }}>{t.timeLeft(formatCountdown(seconds))}</AppText>
      </View>

      <Card title={t.addressTitle}>
        <View style={styles.reserved}>
          <ShieldCheck color={colors.success} size={16} />
          <AppText variant="muted" style={{ fontSize: 13 }}>
            {t.reserved}
          </AppText>
        </View>
        <AppForm<AddressValues>
          schema={schema}
          defaultValues={{
            fullName: session.shippingAddress?.fullName ?? '',
            street: session.shippingAddress?.street ?? '',
            postalCode: session.shippingAddress?.postalCode ?? '',
            city: session.shippingAddress?.city ?? '',
            province: session.shippingAddress?.province ?? '',
            phone: session.shippingAddress?.phone ?? '',
            notes: session.shippingAddress?.notes ?? '',
          }}
          fields={fields}
          submitLabel={t.saveAddress}
          onSubmit={saveAddress}
        />
      </Card>

      <Card title={t.summary}>
        {session.lines.map((line) => (
          <View key={line.variantId} style={styles.row}>
            <AppText style={{ flex: 1 }} numberOfLines={2}>
              {line.qty}× {line.productName}
            </AppText>
            <AppText>{formatPrice(line.lineTotalCents)}</AppText>
          </View>
        ))}

        {promoCodesOn && <PromoCodeField session={session} onChange={setSession} />}

        <View style={styles.row}>
          <AppText variant="muted">{t.subtotal}</AppText>
          <AppText>{formatPrice(session.subtotalCents)}</AppText>
        </View>
        {session.promoCode && (
          <View style={styles.row}>
            <AppText style={{ color: colors.primary }}>
              {t.promoLine} {session.promoCode.code}
            </AppText>
            <AppText style={{ color: colors.primary }}>
              -{formatPrice(session.promoCode.discountCents)}
            </AppText>
          </View>
        )}
        {session.discountCents > 0 && (
          <View style={styles.row}>
            <AppText style={{ color: colors.primary }}>{t.discounts}</AppText>
            <AppText style={{ color: colors.primary }}>
              -{formatPrice(session.discountCents)}
            </AppText>
          </View>
        )}
        <View style={styles.row}>
          <AppText variant="muted">{t.shipping}</AppText>
          <AppText>
            {session.shippingCents > 0 ? formatPrice(session.shippingCents) : t.shippingFree}
          </AppText>
        </View>
        {session.taxes.map((tax) => (
          <View key={tax.rate} style={styles.row}>
            <AppText variant="muted">{t.tax(tax.rate)}</AppText>
            <AppText>{formatPrice(tax.taxCents)}</AppText>
          </View>
        ))}

        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
          <AppText variant="subtitle">{t.total}</AppText>
          <AppText variant="subtitle">{formatPrice(session.totalCents)}</AppText>
        </View>
        <AppText variant="muted" style={{ fontSize: 12 }}>
          {t.taxIncluded}
        </AppText>

        <Button
          label={placing ? t.confirming : t.confirm}
          loading={placing}
          disabled={placing}
          haptic="success"
          onPress={() => void placeOrder()}
        />
        <AppText variant="muted" style={{ fontSize: 12 }}>
          {t.confirmNotice}
        </AppText>
      </Card>

      <Button label={t.cancel} variant="ghost" onPress={() => void cancel()} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  reserved: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  promoRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  promoInput: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, fontSize: 15 },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
})
