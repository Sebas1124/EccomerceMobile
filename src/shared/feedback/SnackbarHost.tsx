import { CheckCircle2, Info, Loader2, TriangleAlert, X, XCircle, type LucideIcon } from 'lucide-react-native'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutDown,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '@/features/theme'
import type { Palette } from '@/shared/theme/tokens'
import { radius, spacing } from '@/shared/theme/tokens'
import { useSnackbarStore, type SnackbarItem, type SnackbarVariant } from './snackbar-store'

const icons: Record<SnackbarVariant, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
  loading: Loader2,
}

const accent = (variant: SnackbarVariant, colors: Palette) =>
  ({
    success: colors.success,
    error: colors.destructive,
    warning: colors.warning,
    info: colors.info,
    loading: colors.primary,
  })[variant]

/** Barra que consume el tiempo restante del snackbar. */
function ProgressBar({ duration, color }: { duration: number; color: string }) {
  const progress = useSharedValue(1)
  const reduce = useReducedMotion()

  useEffect(() => {
    progress.set(withTiming(0, { duration, easing: Easing.linear }))
  }, [duration, progress])

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }))
  if (!Number.isFinite(duration) || reduce) return null
  return <Animated.View style={[styles.progress, { backgroundColor: color }, style]} />
}

/**
 * Duración de la entrada y la salida. Un aviso tiene que verse, no llamar la
 * atención: nada de muelles, que rebotan varias veces y se hacen pesados.
 */
const ENTER_MS = 220
const EXIT_MS = 160

/** Icono con animación propia de cada evento (aparición, sacudida, pulso, giro). */
function AnimatedIcon({ variant, color }: { variant: SnackbarVariant; color: string }) {
  const reduce = useReducedMotion()
  const scale = useSharedValue(1)
  const x = useSharedValue(0)
  const rotate = useSharedValue(0)

  useEffect(() => {
    if (variant === 'loading') {
      rotate.set(withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1))
      return
    }
    if (reduce) return
    if (variant === 'success') {
      // Crece un poco al aparecer y para. Antes era un muelle muy suelto
      // (damping 8) que rebotaba media docena de veces.
      scale.set(0.85)
      scale.set(withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }))
    } else if (variant === 'error') {
      // La sacudida sí aporta: avisa de que algo ha ido mal. Corta y pequeña.
      x.set(withSequence(...[-3, 3, 0].map((v) => withTiming(v, { duration: 60 }))))
    } else if (variant === 'warning') {
      scale.set(withSequence(withTiming(1.1, { duration: 140 }), withTiming(1, { duration: 140 })))
    }
  }, [variant, reduce, scale, x, rotate])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }, { translateX: x.get() }, { rotate: `${rotate.get()}deg` }],
  }))
  const Icon = icons[variant]
  return (
    <Animated.View style={[styles.iconWrap, { backgroundColor: `${color}26` }, style]}>
      <Icon color={color} size={20} />
    </Animated.View>
  )
}

function SnackbarCard({ item }: { item: SnackbarItem }) {
  const colors = useColors()
  const reduce = useReducedMotion()
  const dismiss = useSnackbarStore((s) => s.dismiss)
  const color = accent(item.variant, colors)
  const isAlert = item.variant === 'error' || item.variant === 'warning'

  return (
    <Animated.View
      // Sube unos pocos píxeles y se funde. `SlideInDown` recorría la pantalla
      // entera y, con muelle, llegaba dando tumbos.
      entering={
        reduce
          ? FadeIn.duration(ENTER_MS)
          : FadeInDown.duration(ENTER_MS).easing(Easing.out(Easing.cubic))
      }
      exiting={FadeOutDown.duration(EXIT_MS)}
      layout={LinearTransition.duration(ENTER_MS)}
      accessibilityRole={isAlert ? 'alert' : 'summary'}
      accessibilityLiveRegion={isAlert ? 'assertive' : 'polite'}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: color },
      ]}
    >
      <ProgressBar duration={item.duration} color={color} />
      <AnimatedIcon variant={item.variant} color={color} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
        {item.description && (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{item.description}</Text>
        )}
        {item.action && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              item.action?.onPress()
              dismiss(item.id)
            }}
          >
            <Text style={[styles.action, { color: colors.primary }]}>{item.action.label}</Text>
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={() => dismiss(item.id)}
        accessibilityRole="button"
        accessibilityLabel="Cerrar notificación"
        hitSlop={12}
      >
        <X color={colors.mutedForeground} size={18} />
      </Pressable>
    </Animated.View>
  )
}

/** Pila de snackbars. Se monta una vez en el layout raíz; se usa con `notify`. */
export function SnackbarHost() {
  const items = useSnackbarStore((s) => s.items)
  const insets = useSafeAreaInsets()
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 72 }]}>
      {items.map((item) => (
        <SnackbarCard key={item.id} item={item} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.lg, right: spacing.lg, gap: spacing.sm, zIndex: 1000 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, transformOrigin: 'left' },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 13 },
  action: { fontSize: 14, fontWeight: '600', marginTop: spacing.xs },
})
