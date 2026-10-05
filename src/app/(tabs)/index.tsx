import { CheckCircle2, CircleOff } from 'lucide-react-native'
import { View } from 'react-native'
import { FeatureKey, useAppConfigStore } from '@/features/app-config'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Screen } from '@/shared/components/Screen'
import { texts } from '@/shared/constants/texts'
import { radius, spacing } from '@/shared/theme/tokens'

/** Inicio provisional. La feature landing-builder lo sustituye por secciones dinámicas. */
export default function HomeScreen() {
  const colors = useColors()
  const config = useAppConfigStore((s) => s.config)

  return (
    <Screen>
      <View style={{ gap: spacing.sm, paddingVertical: spacing.xl }}>
        <AppText variant="title">{texts.home.heroTitle}</AppText>
        <AppText variant="muted">{texts.home.heroSubtitle}</AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {Array.from({ length: 4 }, (_, i) => (
          <View
            key={i}
            style={{ width: '47%', aspectRatio: 0.8, borderRadius: radius.lg, backgroundColor: colors.muted }}
          />
        ))}
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
        {Object.values(FeatureKey).map((key) => {
          const on = config.features[key] === true
          return (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {on ? (
                <CheckCircle2 size={16} color={colors.primary} />
              ) : (
                <CircleOff size={16} color={colors.mutedForeground} />
              )}
              <AppText variant="muted">{key}</AppText>
            </View>
          )
        })}
      </View>
    </Screen>
  )
}
