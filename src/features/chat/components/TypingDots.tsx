import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { spacing } from '@/shared/theme/tokens'
import { chatTexts as t } from '../texts'

/** Duración de un salto completo y desfase entre puntos. */
const BOUNCE_MS = 340
const STEP_MS = 120

function Dot({ index, color }: { index: number; color: string }) {
  const lift = useSharedValue(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    lift.set(
      withDelay(
        index * STEP_MS,
        withRepeat(
          withSequence(
            withTiming(1, { duration: BOUNCE_MS, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: BOUNCE_MS, easing: Easing.in(Easing.quad) }),
            // Pausa antes de volver a empezar, para que la onda respire.
            withTiming(0, { duration: BOUNCE_MS }),
          ),
          -1,
        ),
      ),
    )
  }, [index, lift, reduce])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() * -4 }],
    opacity: 0.45 + lift.get() * 0.55,
  }))

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />
}

/**
 * Tres puntos saltando: el "está escribiendo" de toda la vida.
 *
 * Con movimiento reducido se quedan quietos; el aviso se entiende igual por el
 * texto, que además es lo que lee un lector de pantalla.
 */
export function TypingDots({ label }: { label?: string }) {
  const colors = useColors()

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={label ?? t.typing}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.dots}>
        {[0, 1, 2].map((index) => (
          <Dot key={index} index={index} color={colors.mutedForeground} />
        ))}
      </View>
      {label ? (
        <AppText variant="muted" style={{ fontSize: 12 }}>
          {label}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
})
