import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { useColors } from '@/features/theme'
import { radius, spacing } from '@/shared/theme/tokens'
import { AppText } from './AppText'

export function Card({
  title,
  description,
  children,
  style,
}: {
  title?: string
  description?: string
  children?: ReactNode
  style?: ViewStyle
}) {
  const colors = useColors()
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {title && <AppText variant="subtitle">{title}</AppText>}
      {description && <AppText variant="muted">{description}</AppText>}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
})
