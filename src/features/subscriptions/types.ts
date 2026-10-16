/** Ventajas que puede llevar un plan. Espejo de `subscriptions.benefits.ts`. */
export interface SubscriptionBenefits {
  freeShipping: 'no' | 'always' | 'threshold'
  freeShippingFromCents: number
  discountPercent: number
  extraReturnDays: number
  earlyAccessHours: number
  monthlyCouponCents: number
  cashbackPercent: number
  prioritySupport: boolean
  noMinimumOrder: boolean
  birthdayGiftCents: number
  guests: number
  recurringOrders: number
}

/** Un plan tal y como lo ve quien compra. */
export interface PublicPlan {
  id: string
  code: string
  name: string
  description: string
  priceCents: number
  benefits: SubscriptionBenefits
  position: number
}

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'PAUSED' | 'CANCELLED'

export interface MySubscription {
  id: string
  status: SubscriptionStatus
  priceCents: number
  benefits: SubscriptionBenefits
  startedAt: string
  renewsAt: string
  cancelledAt: string | null
  providerId: string
  plan: { id: string; code: string; name: string; description: string }
}
