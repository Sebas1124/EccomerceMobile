import { create } from 'zustand'
import { api } from '@/shared/lib/api-client'
import { FeatureKey, type PublicConfig } from './types'

export const fallbackConfig: PublicConfig = {
  branding: {
    appName: 'Mi Tienda',
    logoUrl: null,
    faviconUrl: null,
    colors: { primary: '#7c3aed', accent: '#0ea5e9' },
    defaultTheme: 'dark',
  },
  store: {
    locale: 'es-ES',
    currency: 'EUR',
    pricesIncludeVat: true,
    defaultVatRate: 0.21,
    supportEmail: null,
  },
  features: { [FeatureKey.Inventory]: true, [FeatureKey.LandingBuilder]: true, [FeatureKey.TwoFactor]: true },
}

interface AppConfigState {
  config: PublicConfig
  status: 'idle' | 'loading' | 'ready' | 'error'
  load: () => Promise<void>
}

/** Configuración pública de la instancia. Se carga al arrancar y al volver a primer plano. */
export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  config: fallbackConfig,
  status: 'idle',
  load: async () => {
    if (get().status === 'loading') return
    set({ status: 'loading' })
    try {
      const config = await api.get<PublicConfig>('/public/config', {
        auth: false,
        cache: 'no-store',
      })
      set({ config, status: 'ready' })
    } catch {
      set({ status: 'error' })
    }
  },
}))

export const useFeature = (key: FeatureKey) => useAppConfigStore((s) => s.config.features[key] === true)
export const useBranding = () => useAppConfigStore((s) => s.config.branding)
