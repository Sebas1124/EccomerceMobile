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
  Subscriptions: 'commerce.subscriptions',
  Payments: 'payments',
  PaymentStripe: 'payments.stripe',
  PaymentPaypal: 'payments.paypal',
  PaymentKlarna: 'payments.klarna',
  PaymentApplePay: 'payments.apple-pay',
  PaymentGooglePay: 'payments.google-pay',
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

/** Plataformas con icono propio. La dirección la pone el administrador. */
export const SOCIAL_PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'linkedin',
  'pinterest',
  'telegram',
  'whatsapp',
  'web',
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export interface SocialLink {
  platform: SocialPlatform
  url: string
}

/**
 * Cómo se contacta con la tienda y dónde está. Lo edita el panel; aquí solo se
 * enseña.
 */
export interface ContactSettings {
  phone: string
  /** Internacional sin signos (34600111222). Vacío = sin botón de WhatsApp. */
  whatsapp: string
  location: string
  hours: { label: string; value: string }[]
  social: SocialLink[]
}

export interface StoreSettings {
  locale: 'es-ES'
  currency: 'EUR'
  pricesIncludeVat: boolean
  defaultVatRate: number
  supportEmail: string | null
  /** Pedido mínimo en céntimos. 0 = sin mínimo. */
  minOrderCents: number
  /** Zona horaria de la tienda: decide dónde empieza el día en los informes. */
  timeZone: string
}

export interface PublicConfig {
  branding: Branding
  store: StoreSettings
  contact: ContactSettings
  features: Partial<Record<FeatureKey, boolean>>
}
