import { Text, type TextProps } from 'react-native'
import { useColors } from '@/features/theme'

type Variant = 'title' | 'subtitle' | 'body' | 'muted' | 'label' | 'error'

const sizes: Record<Variant, { fontSize: number; fontWeight: '400' | '500' | '600' | '700' }> = {
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  muted: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 14, fontWeight: '500' },
  error: { fontSize: 13, fontWeight: '400' },
}

/** Texto con colores del tema. Respeta el escalado de fuente del sistema (accesibilidad). */
export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  const colors = useColors()
  const color =
    variant === 'muted'
      ? colors.mutedForeground
      : variant === 'error'
        ? colors.destructive
        : colors.foreground
  return (
    <Text
      accessibilityRole={variant === 'title' ? 'header' : undefined}
      style={[sizes[variant], { color }, style]}
      {...props}
    />
  )
}
