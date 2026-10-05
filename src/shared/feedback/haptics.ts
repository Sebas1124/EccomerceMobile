import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'
import { create } from 'zustand'

/**
 * Respuesta háptica personalizable (experiencia premium).
 *
 * - Cada interacción dispara un EVENTO semántico (`haptics.trigger('cart.add')`), no una vibración suelta.
 * - Cada evento se resuelve a un PATRÓN (secuencia de pasos con pausas) que se puede sobrescribir por
 *   instancia con `configureHaptics({ 'cart.add': [...] })`, p. ej. según la marca del cliente.
 * - El usuario puede desactivarla desde su cuenta; se respeta siempre.
 */

export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'

export type HapticStep =
  | { type: 'impact'; style: ImpactStyle }
  | { type: 'notification'; style: 'success' | 'warning' | 'error' }
  | { type: 'selection' }
  | { type: 'pause'; ms: number }

export type HapticPattern = HapticStep[]

/** Catálogo de eventos. Añade aquí los de cada feature (carrito, favoritos, checkout...). */
export type HapticEvent =
  | 'tap'
  | 'selection'
  | 'toggle'
  | 'success'
  | 'warning'
  | 'error'
  | 'confirm.open'
  | 'confirm.accept'
  | 'destructive'
  | 'theme.toggle'
  | 'otp.complete'
  | 'cart.add'
  | 'cart.remove'
  | 'favorite.toggle'
  | 'checkout.complete'
  | 'pull.refresh'

const impact = (style: ImpactStyle): HapticStep => ({ type: 'impact', style })
const notification = (style: Extract<HapticStep, { type: 'notification' }>['style']): HapticStep => ({
  type: 'notification',
  style,
})
const pause = (ms: number): HapticStep => ({ type: 'pause', ms })

/**
 * Patrones por defecto. Se evita `selection` en solitario: en iOS apenas se percibe,
 * así que las interacciones usan impactos y los resultados combinan impacto + notificación.
 */
export const defaultPatterns: Record<HapticEvent, HapticPattern> = {
  tap: [impact('medium')],
  selection: [impact('light')],
  toggle: [impact('medium')],
  success: [impact('medium'), pause(60), notification('success')],
  warning: [impact('heavy'), pause(60), notification('warning')],
  error: [impact('heavy'), pause(70), notification('error')],
  'confirm.open': [impact('medium')],
  'confirm.accept': [impact('heavy')],
  destructive: [impact('heavy'), pause(60), impact('heavy')],
  'theme.toggle': [impact('medium'), pause(240), impact('medium')],
  'otp.complete': [impact('medium'), pause(50), notification('success')],
  // Doble pulso: "entra" en el carrito y se confirma.
  'cart.add': [impact('heavy'), pause(70), notification('success')],
  'cart.remove': [impact('rigid'), pause(50), impact('light')],
  'favorite.toggle': [impact('medium'), pause(50), impact('light')],
  'checkout.complete': [impact('heavy'), pause(90), notification('success'), pause(80), impact('medium')],
  'pull.refresh': [impact('medium')],
}

/** Intensidad global elegida por el usuario. Escala los impactos de todos los patrones. */
export type HapticIntensity = 'subtle' | 'standard' | 'strong'

const INTENSITY_MAP: Record<HapticIntensity, Record<ImpactStyle, ImpactStyle>> = {
  subtle: { light: 'light', soft: 'soft', medium: 'light', rigid: 'soft', heavy: 'medium' },
  standard: { light: 'light', soft: 'soft', medium: 'medium', rigid: 'rigid', heavy: 'heavy' },
  strong: { light: 'medium', soft: 'rigid', medium: 'heavy', rigid: 'heavy', heavy: 'heavy' },
}

const STORAGE_KEY = 'haptics.enabled'
const INTENSITY_KEY = 'haptics.intensity'
const supported = Platform.OS === 'ios' || Platform.OS === 'android'

interface HapticsState {
  enabled: boolean
  intensity: HapticIntensity
  patterns: Record<HapticEvent, HapticPattern>
  hydrate: () => Promise<void>
  setEnabled: (enabled: boolean) => void
  setIntensity: (intensity: HapticIntensity) => void
  configure: (overrides: Partial<Record<HapticEvent, HapticPattern>>) => void
}

export const useHapticsStore = create<HapticsState>((set) => ({
  enabled: true,
  intensity: 'standard',
  patterns: defaultPatterns,
  hydrate: async () => {
    const [enabled, intensity] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
      AsyncStorage.getItem(INTENSITY_KEY).catch(() => null),
    ])
    set({
      ...(enabled !== null ? { enabled: enabled === '1' } : {}),
      ...(intensity === 'subtle' || intensity === 'standard' || intensity === 'strong' ? { intensity } : {}),
    })
  },
  setEnabled: (enabled) => {
    set({ enabled })
    AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0').catch(() => undefined)
  },
  setIntensity: (intensity) => {
    set({ intensity })
    AsyncStorage.setItem(INTENSITY_KEY, intensity).catch(() => undefined)
  },
  configure: (overrides) => set((s) => ({ patterns: { ...s.patterns, ...overrides } })),
}))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function runStep(step: HapticStep, intensity: HapticIntensity) {
  switch (step.type) {
    case 'impact':
      return Haptics.impactAsync(
        {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
          soft: Haptics.ImpactFeedbackStyle.Soft,
          rigid: Haptics.ImpactFeedbackStyle.Rigid,
        }[INTENSITY_MAP[intensity][step.style]],
      )
    case 'notification':
      return Haptics.notificationAsync(
        {
          success: Haptics.NotificationFeedbackType.Success,
          warning: Haptics.NotificationFeedbackType.Warning,
          error: Haptics.NotificationFeedbackType.Error,
        }[step.style],
      )
    case 'selection':
      return Haptics.selectionAsync()
    case 'pause':
      return wait(step.ms)
  }
}

export const haptics = {
  /** Dispara el patrón del evento. Nunca lanza: la háptica es decorativa. */
  async trigger(event: HapticEvent) {
    const { enabled, patterns, intensity } = useHapticsStore.getState()
    if (!supported || !enabled) return
    try {
      for (const step of patterns[event]) await runStep(step, intensity)
    } catch {
      // Dispositivo sin motor háptico o permiso denegado: se ignora.
    }
  },
}

/** Sobrescribe patrones (p. ej. al arrancar la app según la marca). */
export const configureHaptics = (overrides: Partial<Record<HapticEvent, HapticPattern>>) =>
  useHapticsStore.getState().configure(overrides)
