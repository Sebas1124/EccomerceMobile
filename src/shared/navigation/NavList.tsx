import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, StyleSheet } from 'react-native'
import { useAppConfigStore } from '@/features/app-config'
import { useAuthStore } from '@/features/auth'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Card } from '@/shared/components/Card'
import { haptics } from '@/shared/feedback'
import { spacing } from '@/shared/theme/tokens'
import { navGroups, type NavItem } from './items'

/**
 * Los enlaces de un grupo como lista compacta dentro de una tarjeta.
 *
 * Sustituye a la pila de botones grandes que había en la pantalla de cuenta:
 * una lista se lee de un vistazo y no convierte cada enlace en un bloque.
 */
export function NavList({ group }: { group: string }) {
  const colors = useColors()
  const authed = useAuthStore((s) => s.status === 'authenticated')
  const features = useAppConfigStore((s) => s.config.features)

  const items = (navGroups.find((one) => one.title === group)?.items ?? []).filter(
    (item) => (!item.private || authed) && (!item.feature || features[item.feature] === true),
  )
  if (items.length === 0) return null

  const go = (item: NavItem) => {
    void haptics.trigger('selection')
    router.push(item.href)
  }

  return (
    <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <Pressable
            key={String(item.href)}
            accessibilityRole="link"
            onPress={() => go(item)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
              },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Icon size={18} color={colors.mutedForeground} />
            <AppText style={{ flex: 1 }}>{item.label}</AppText>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Pressable>
        )
      })}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
})

/** Reexportado para que la pantalla de cuenta no tenga que conocer los grupos. */
export const NAV_GROUPS = { account: 'Mi cuenta', info: 'Información' } as const
