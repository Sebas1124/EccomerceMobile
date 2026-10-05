import { Image } from 'expo-image'
import { router } from 'expo-router'
import { AlertTriangle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native'
import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { FeatureKey, useFeature } from '@/features/app-config'
import { useAuthStore } from '@/features/auth'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, notify } from '@/shared/feedback'
import { formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { useCartStore } from '../store/cart-store'
import { cartTexts as t } from '../texts'
import type { CartLine } from '../types'

/** Botón redondo de más/menos unidades. */
function StepButton({
  icon: Icon,
  label,
  disabled,
  onPress,
}: {
  icon: typeof Plus
  label: string
  disabled?: boolean
  onPress: () => void
}) {
  const colors = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.step,
        { borderColor: colors.border, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      <Icon color={colors.foreground} size={16} />
    </Pressable>
  )
}

function LineRow({ line }: { line: CartLine }) {
  const colors = useColors()
  const { setQty, remove, busy } = useCartStore()

  const change = async (qty: number) => {
    try {
      await setQty(line.id, qty)
    } catch (error) {
      notify.fromError(error)
    }
  }

  return (
    <View style={styles.line}>
      {line.product.imageUrl ? (
        <Image
          source={{ uri: line.product.imageUrl }}
          style={styles.thumb}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.thumb, { backgroundColor: colors.muted }]} />
      )}

      <View style={styles.lineBody}>
        <AppText numberOfLines={2} style={{ fontWeight: '500' }}>
          {line.product.name}
        </AppText>
        <AppText variant="muted" style={{ fontSize: 13 }}>
          {line.variant.name} · {t.unit}: {formatPrice(line.variant.finalPriceCents)}
        </AppText>

        {line.issue && (
          <View style={styles.issue}>
            <AlertTriangle color={colors.destructive} size={14} />
            <AppText variant="error">{t.issues[line.issue]}</AppText>
          </View>
        )}

        <View style={styles.controls}>
          <StepButton
            icon={Minus}
            label={t.decrease}
            disabled={busy}
            onPress={() => void change(line.qty - 1)}
          />
          <AppText style={{ minWidth: 24, textAlign: 'center' }}>{line.qty}</AppText>
          <StepButton
            icon={Plus}
            label={t.increase}
            disabled={busy || line.qty >= line.variant.available}
            onPress={() => void change(line.qty + 1)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.removeLine}
            disabled={busy}
            onPress={() => {
              void remove(line.id).then(() => notify.success(t.removed))
            }}
            style={({ pressed }) => [styles.step, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
          >
            <Trash2 color={colors.destructive} size={16} />
          </Pressable>
        </View>
      </View>

      <AppText style={{ fontWeight: '600' }}>{formatPrice(line.lineTotalCents)}</AppText>
    </View>
  )
}

export function CartScreen() {
  const colors = useColors()
  const status = useAuthStore((state) => state.status)
  const shippingOn = useFeature(FeatureKey.Shipping)
  const { cart, busy, guest, load, clear } = useCartStore()

  useEffect(() => {
    if (status === 'idle' || status === 'loading') return
    load(status === 'authenticated').catch((error: unknown) =>
      notify.fromError(error, t.loadError),
    )
  }, [status, load])

  const askClear = () =>
    confirm({
      title: t.clearTitle,
      description: t.clearConfirm,
      tone: 'danger',
      confirmLabel: t.clear,
      action: async () => {
        await clear()
        notify.success(t.cleared)
      },
    })

  if (cart.lines.length === 0) {
    return (
      <Screen centered>
        <View style={styles.empty}>
          <ShoppingCart color={colors.mutedForeground} size={36} />
          <AppText variant="muted">{t.empty}</AppText>
          <Button
            label={t.emptyAction}
            variant="outline"
            fullWidth={false}
            onPress={() => router.push('/catalog')}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <AppText variant="muted">{t.items(cart.itemCount)}</AppText>

      <Card>
        {cart.lines.map((line) => (
          <LineRow key={line.id} line={line} />
        ))}
        <Button
          label={t.clear}
          variant="ghost"
          icon={Trash2}
          disabled={busy}
          fullWidth={false}
          onPress={() => void askClear()}
        />
      </Card>

      <Card>
        <View style={styles.totalRow}>
          <AppText variant="muted">{t.subtotal}</AppText>
          <AppText>{formatPrice(cart.subtotalCents)}</AppText>
        </View>
        {cart.taxes.map((tax) => (
          <View key={tax.rate} style={styles.totalRow}>
            <AppText variant="muted">{t.tax(tax.rate)}</AppText>
            <AppText>{formatPrice(tax.taxCents)}</AppText>
          </View>
        ))}
        {cart.discountCents > 0 && (
          <View style={styles.totalRow}>
            <AppText style={{ color: colors.primary }}>{t.discounts}</AppText>
            <AppText style={{ color: colors.primary }}>
              -{formatPrice(cart.discountCents)}
            </AppText>
          </View>
        )}
        {shippingOn && (
          <View style={styles.totalRow}>
            <AppText variant="muted">{t.shipping}</AppText>
            <AppText variant="muted">{t.shippingAtCheckout}</AppText>
          </View>
        )}

        <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
          <AppText variant="subtitle">{t.total}</AppText>
          <AppText variant="subtitle">{formatPrice(cart.totalCents)}</AppText>
        </View>
        <AppText variant="muted" style={{ fontSize: 12 }}>
          {t.taxIncluded}
        </AppText>

        {guest ? (
          <>
            <AppText variant="muted">{t.guestNotice}</AppText>
            <Button label={t.login} onPress={() => router.push('/login')} />
          </>
        ) : (
          <Button
            label={t.checkout}
            disabled={cart.hasIssues || busy}
            onPress={() => router.push('/checkout')}
          />
        )}
        <Button
          label={t.continueShopping}
          variant="ghost"
          onPress={() => router.push('/catalog')}
        />
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  thumb: { width: 64, height: 64, borderRadius: radius.lg },
  lineBody: { flex: 1, gap: spacing.xs },
  issue: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  step: { width: 32, height: 32, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { alignItems: 'center', gap: spacing.lg },
})
