import AsyncStorage from '@react-native-async-storage/async-storage'
import { AccessibilityInfo } from 'react-native'
import { create } from 'zustand'
import { palettes, type ThemeName } from '@/shared/theme/tokens'

// El tema no es sensible: AsyncStorage basta (los tokens de sesión van en SecureStore).
const STORAGE_KEY = 'theme'
export const COVER_MS = 220
export const MORPH_MS = 320
export const REVEAL_MS = 280

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Fase del overlay de transición. <ThemeOverlay /> anima según esta fase. */
export type TransitionPhase = 'idle' | 'cover' | 'morph' | 'reveal'

interface ThemeState {
  theme: ThemeName
  hasPreference: boolean
  phase: TransitionPhase
  from: string
  to: string
  hydrate: () => Promise<void>
  applyDefault: (theme: ThemeName) => void
  toggle: () => Promise<void>
}

/**
 * Tema global (zustand, sin providers). Misma transición que la web:
 * cubrir con el color saliente → cambiar tema y transformar al entrante → revelar.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  hasPreference: false,
  phase: 'idle',
  from: palettes.dark.background,
  to: palettes.dark.background,

  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null)
    if (stored === 'light' || stored === 'dark') set({ theme: stored, hasPreference: true })
  },

  applyDefault: (theme) => {
    if (!get().hasPreference) set({ theme })
  },

  toggle: async () => {
    const { theme, phase } = get()
    if (phase !== 'idle') return
    const next: ThemeName = theme === 'dark' ? 'light' : 'dark'
    const commit = () => {
      set({ theme: next, hasPreference: true })
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
    }
    if (await AccessibilityInfo.isReduceMotionEnabled()) return commit()

    set({ phase: 'cover', from: palettes[theme].background, to: palettes[next].background })
    await wait(COVER_MS)
    commit()
    set({ phase: 'morph' })
    await wait(MORPH_MS)
    set({ phase: 'reveal' })
    await wait(REVEAL_MS)
    set({ phase: 'idle' })
  },
}))
