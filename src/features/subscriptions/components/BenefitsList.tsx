import { StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { spacing } from '@/shared/theme/tokens'
import { benefitLines } from '../lib/benefit-lines'
import { subscriptionsTexts as t } from '../texts'
import type { SubscriptionBenefits } from '../types'

/** Las ventajas de un plan, en lista. */
export function BenefitsList({ benefits }: { benefits: SubscriptionBenefits }) {
  const colors = useColors()
  const lines = benefitLines(benefits)

  if (lines.length === 0) {
    return <AppText variant="muted">{t.benefits.none}</AppText>
  }

  return (
    <View style={styles.list}>
      {lines.map((line) => (
        <View key={line.key} style={styles.row}>
          <line.icon color={colors.primary} size={16} />
          <AppText style={{ flex: 1, fontSize: 14 }}>{line.label}</AppText>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
})
