import { Minus, Plus } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { haptics } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import { catalogTexts as t } from '../texts'

function StepButton({
  icon: Icon,
  label,
  disabled,
  onPress,
}: {
  icon: typeof Plus
  label: string
  disabled: boolean
  onPress: () => void
}) {
  const colors = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        void haptics.trigger('selection')
        onPress()
      }}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.border, opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <Icon color={colors.foreground} size={18} />
    </Pressable>
  )
}

/**
 * Cuántas unidades se añaden de una vez. El tope es el stock disponible: pedir
 * más de lo que hay solo serviría para que el servidor lo rechazara después.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number
  /** Unidades disponibles ahora mismo. */
  max: number
  onChange: (value: number) => void
}) {
  const colors = useColors()
  const atMax = value >= max

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <AppText variant="label">{t.quantity}</AppText>
        {atMax && max > 0 && (
          <AppText variant="muted" style={{ fontSize: 12 }}>
            {t.maxUnits(max)}
          </AppText>
        )}
      </View>

      <View style={[styles.stepper, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <StepButton
          icon={Minus}
          label={t.decrease}
          disabled={value <= 1}
          onPress={() => onChange(value - 1)}
        />
        <AppText style={styles.value}>{value}</AppText>
        <StepButton
          icon={Plus}
          label={t.increase}
          disabled={atMax}
          onPress={() => onChange(value + 1)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.full },
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '600' },
})
