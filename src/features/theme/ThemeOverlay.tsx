import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { COVER_MS, MORPH_MS, REVEAL_MS, useThemeStore } from './theme-store'

/** Overlay a pantalla completa de la transición de tema. Se monta una vez en el layout raíz. */
export function ThemeOverlay() {
  const phase = useThemeStore((s) => s.phase)
  const from = useThemeStore((s) => s.from)
  const to = useThemeStore((s) => s.to)
  const opacity = useSharedValue(0)
  const morph = useSharedValue(0)
  const fromColor = useSharedValue(from)
  const toColor = useSharedValue(to)

  useEffect(() => {
    fromColor.set(from)
    toColor.set(to)
    if (phase === 'cover') {
      morph.set(0)
      opacity.set(withTiming(1, { duration: COVER_MS }))
    } else if (phase === 'morph') {
      morph.set(withTiming(1, { duration: MORPH_MS }))
    } else if (phase === 'reveal') {
      opacity.set(withTiming(0, { duration: REVEAL_MS }))
    }
  }, [phase, from, to, opacity, morph, fromColor, toColor])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    backgroundColor: interpolateColor(morph.get(), [0, 1], [fromColor.get(), toColor.get()]),
  }))

  return (
    <Animated.View
      pointerEvents={phase === 'idle' ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, { zIndex: 9999 }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )
}
