/**
 * Espejo de backend/src/core/features/feature-catalog.ts.
 * TODO(openapi): generar estos tipos con openapi-typescript desde el backend.
 */
export const FeatureKey = {
  Passkeys: 'auth.passkeys',
  TwoFactor: 'auth.two-factor',
  Inventory: 'commerce.inventory',
  Promotions: 'commerce.promotions',
  PromoCodes: 'commerce.promo-codes',
  Payments: 'payments',
  PaymentStripe: 'payments.stripe',
  PaymentPaypal: 'payments.paypal',
  SavedPaymentMethods: 'payments.saved-methods',
  ManualPayments: 'payments.manual',
  Shipping: 'shipping',
  RefundPolicies: 'after-sales.refund-policies',
  Returns: 'after-sales.returns',
  Tickets: 'support.tickets',
  Chat: 'support.chat',
  News: 'content.news',
  LandingBuilder: 'content.landing-builder',
  VideoPresentation: 'content.video-presentation',
  PushNotifications: 'integrations.push',
  EmailSmtp: 'integrations.smtp',
  MediaCloudinary: 'integrations.cloudinary',
} as const

export type FeatureKey = (typeof FeatureKey)[keyof typeof FeatureKey]

export interface Branding {
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  colors: { primary: string; accent: string }
  defaultTheme: 'dark' | 'light'
}

export interface StoreSettings {
  locale: 'es-ES'
  currency: 'EUR'
  pricesIncludeVat: boolean
  defaultVatRate: number
  supportEmail: string | null
}

export interface PublicConfig {
  branding: Branding
  store: StoreSettings
  features: Partial<Record<FeatureKey, boolean>>
}
