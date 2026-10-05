import { Moon, Sun } from 'lucide-react-native'
import { Pressable } from 'react-native'
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated'
import { texts } from '@/shared/constants/texts'
import { haptics } from '@/shared/feedback/haptics'
import { useThemeStore } from './theme-store'
import { useColors } from './use-colors'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const busy = useThemeStore((s) => s.phase !== 'idle')
  const colors = useColors()
  const isDark = theme === 'dark'

  return (
    <Pressable
      onPress={() => {
        void haptics.trigger('theme.toggle')
        void toggle()
      }}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={isDark ? texts.theme.toLight : texts.theme.toDark}
      hitSlop={12}
      style={{ padding: 8 }}
    >
      <Animated.View key={theme} entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(150)}>
        {isDark ? <Sun color={colors.foreground} size={22} /> : <Moon color={colors.foreground} size={22} />}
      </Animated.View>
    </Pressable>
  )
}
