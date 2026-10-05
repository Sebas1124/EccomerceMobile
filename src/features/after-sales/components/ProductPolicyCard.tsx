import { RotateCcw, Truck } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { radius, spacing } from '@/shared/theme/tokens'
import { refundPoliciesApi } from '../api/after-sales-api'
import { afterSalesTexts as t } from '../texts'
import type { ResolvedPolicy } from '../types'

/**
 * Política de devolución en la ficha del producto. La ruta es pública y no
 * depende de la feature: aunque esté apagada, el cliente ve su derecho de
 * desistimiento, que es lo que hay que enseñarle igualmente.
 */
export function ProductPolicyCard({ productId }: { productId: string }) {
  const colors = useColors()
  const [loaded, setLoaded] = useState<{ productId: string; policy: ResolvedPolicy } | null>(null)

  useEffect(() => {
    let alive = true
    refundPoliciesApi
      .forProduct(productId)
      .then(({ policy }) => {
        if (alive) setLoaded({ productId, policy })
      })
      // Un fallo aquí no puede romper la ficha: simplemente no se pinta.
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [productId])

  if (loaded?.productId !== productId) return null
  const { policy } = loaded

  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <RotateCcw color={colors.foreground} size={16} />
        <AppText variant="label">{t.policyTitle}</AppText>
      </View>
      <AppText>{t.policyWindow(policy.windowDays)}</AppText>
      <View style={styles.header}>
        <Truck color={colors.mutedForeground} size={14} />
        <AppText variant="muted">{t.policyShipping[policy.returnShippingPaidBy]}</AppText>
      </View>
      <AppText variant="muted">
        {policy.feePercent > 0 ? t.policyFee(policy.feePercent) : t.policyNoFee}
      </AppText>
      {policy.conditions && <AppText variant="muted">{policy.conditions}</AppText>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
})
