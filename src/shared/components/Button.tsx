import type { LucideIcon } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useColors } from '@/features/theme'
import { haptics, type HapticEvent } from '@/shared/feedback/haptics'
import { radius, spacing } from '@/shared/theme/tokens'

type Variant = 'primary' | 'destructive' | 'outline' | 'ghost'

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string
  variant?: Variant
  loading?: boolean
  icon?: LucideIcon
  fullWidth?: boolean
  /** Evento háptico al pulsar (false = sin háptica). Por defecto según la variante. */
  haptic?: HapticEvent | false
}

/** Botón reutilizable con variantes, estado de carga y respuesta táctil animada. */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  icon: Icon,
  fullWidth = true,
  disabled,
  style,
  haptic,
  onPress,
  ...props
}: ButtonProps) {
  const colors = useColors()
  const scale = useSharedValue(1)
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.primaryForeground, border: colors.primary },
    destructive: { bg: colors.destructive, fg: '#ffffff', border: colors.destructive },
    outline: { bg: 'transparent', fg: colors.foreground, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  }
  const { bg, fg, border } = palette[variant]
  const isDisabled = disabled || loading
  const hapticEvent = haptic ?? (variant === 'destructive' ? 'destructive' : 'tap')

  return (
    <Animated.View style={[fullWidth && styles.full, animated]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={() => scale.set(withSpring(0.97))}
        onPressOut={() => scale.set(withSpring(1))}
        onPress={(event) => {
          if (hapticEvent) void haptics.trigger(hapticEvent)
          onPress?.(event)
        }}
        style={(state) => [
          styles.base,
          { backgroundColor: bg, borderColor: border, opacity: isDisabled ? 0.6 : 1 },
          typeof style === 'function' ? style(state) : style,
        ]}
        {...props}
      >
        <View style={styles.row}>
          {loading ? <ActivityIndicator color={fg} size="small" /> : Icon && <Icon color={fg} size={18} />}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  base: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { fontSize: 16, fontWeight: '600' },
})
