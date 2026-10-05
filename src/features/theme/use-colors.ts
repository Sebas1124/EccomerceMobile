import { useMemo } from 'react'
import { useAppConfigStore } from '@/features/app-config/app-config-store'
import { palettes, toHex, type Palette } from '@/shared/theme/tokens'
import { useThemeStore } from './theme-store'

/** Paleta activa (tema + color de marca del superadmin). */
export function useColors(): Palette {
  const theme = useThemeStore((s) => s.theme)
  const brand = useAppConfigStore((s) => s.config.branding.colors.primary)
  return useMemo(() => {
    const primary = toHex(brand)
    return { ...palettes[theme], ...(primary ? { primary } : {}) }
  }, [theme, brand])
}
