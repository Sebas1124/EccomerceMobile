import { Menu } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { useColors } from '@/features/theme'
import { spacing } from '@/shared/theme/tokens'
import { useDrawerStore } from './drawer-store'

/** Botón de la cabecera que abre el cajón de navegación. */
export function DrawerButton() {
  const colors = useColors()
  const show = useDrawerStore((s) => s.show)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      hitSlop={8}
      onPress={show}
      style={({ pressed }) => [{ paddingHorizontal: spacing.md }, pressed && { opacity: 0.6 }]}
    >
      <Menu size={22} color={colors.foreground} />
    </Pressable>
  )
}
