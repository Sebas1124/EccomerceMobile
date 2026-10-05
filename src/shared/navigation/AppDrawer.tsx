import { router, usePathname } from 'expo-router'
import { X } from 'lucide-react-native'
import { useEffect } from 'react'
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppConfigStore, useBranding } from '@/features/app-config'
import { useAuthStore } from '@/features/auth'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { haptics } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import { useDrawerStore } from './drawer-store'
import { navGroups, type NavItem } from './items'

/** Ancho del panel, sin comerse la pantalla entera. */
const MAX_WIDTH = 320
const WIDTH_RATIO = 0.84

const OPEN_MS = 240
const CLOSE_MS = 180

/** Una ruta está activa si es la pantalla actual o una hija suya. */
function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function DrawerRow({
  item,
  active,
  onPress,
}: {
  item: NavItem
  active: boolean
  onPress: () => void
}) {
  const colors = useColors()
  const Icon = item.icon

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        active && { backgroundColor: colors.muted },
        pressed && { opacity: 0.7 },
      ]}
    >
      {/* Barra de color a la izquierda: el activo no se distingue solo por tono. */}
      {active && <View style={[styles.marker, { backgroundColor: colors.primary }]} />}
      <Icon size={18} color={active ? colors.foreground : colors.mutedForeground} />
      <AppText
        style={{
          flex: 1,
          color: active ? colors.foreground : colors.mutedForeground,
          fontWeight: active ? '600' : '400',
        }}
      >
        {item.label}
      </AppText>
    </Pressable>
  )
}

/**
 * Cajón de navegación.
 *
 * Se monta una vez en el layout raíz y se abre desde la cabecera. Reúne los
 * enlaces que antes estaban apilados como botones dentro de la pantalla de
 * cuenta, y marca siempre en cuál estás.
 */
export function AppDrawer() {
  const open = useDrawerStore((s) => s.open)
  const hide = useDrawerStore((s) => s.hide)
  const colors = useColors()
  const branding = useBranding()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const { width } = useWindowDimensions()
  const authed = useAuthStore((s) => s.status === 'authenticated')
  const features = useAppConfigStore((s) => s.config.features)

  const panelWidth = Math.min(width * WIDTH_RATIO, MAX_WIDTH)
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.set(
      withTiming(open ? 1 : 0, {
        duration: open ? OPEN_MS : CLOSE_MS,
        easing: Easing.out(Easing.cubic),
      }),
    )
  }, [open, progress])

  // El botón físico de Android cierra el cajón antes que la pantalla.
  useEffect(() => {
    if (!open || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      hide()
      return true
    })
    return () => subscription.remove()
  }, [open, hide])

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    // Sin esto el velo seguiría capturando toques con el cajón cerrado.
    pointerEvents: progress.get() > 0 ? 'auto' : 'none',
  }))

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.get(), [0, 1], [-panelWidth, 0]) }],
  }))

  const go = (item: NavItem) => {
    void haptics.trigger('selection')
    hide()
    router.push(item.href)
  }

  const groups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.private || authed) && (!item.feature || features[item.feature] === true),
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}
        // Tocar fuera cierra, que es lo que espera todo el mundo.
        onTouchEnd={hide}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      />

      <Animated.View
        style={[
          styles.panel,
          {
            width: panelWidth,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: colors.card,
            borderRightColor: colors.border,
          },
          panelStyle,
        ]}
        accessibilityViewIsModal={open}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <AppText variant="subtitle" style={{ flex: 1 }} numberOfLines={1}>
            {branding.appName}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú"
            hitSlop={8}
            onPress={hide}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <X size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {groups.map((group) => (
            <View key={group.title} style={{ gap: 2 }}>
              <AppText variant="muted" style={styles.groupTitle}>
                {group.title.toUpperCase()}
              </AppText>
              {group.items.map((item) => (
                <DrawerRow
                  key={String(item.href)}
                  item={item}
                  active={isActive(pathname, String(item.href))}
                  onPress={() => go(item)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 41,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: { padding: spacing.md, gap: spacing.lg },
  groupTitle: { fontSize: 11, letterSpacing: 0.8, paddingHorizontal: spacing.sm, paddingBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  marker: {
    position: 'absolute',
    left: 0,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 3,
    borderRadius: 2,
  },
})
