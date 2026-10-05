export type CheckoutStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'

export interface ShippingAddress {
  fullName: string
  street: string
  city: string
  postalCode: string
  province?: string | null
  country: string
  phone?: string | null
  notes?: string | null
}

export interface AppliedPromoCode {
  id: string
  code: string
  discountCents: number
}

export interface CheckoutLine {
  variantId: string
  productId: string
  productName: string
  productSlug: string
  variantName: string
  sku: string
  qty: number
  listPriceCents: number
  unitPriceCents: number
  vatRate: number
  lineTotalCents: number
  discountCents: number
  promotionName: string | null
}

export interface CheckoutSession {
  id: string
  status: CheckoutStatus
  expiresAt: string
  /** Segundos que quedan de reserva. */
  secondsLeft: number
  lines: CheckoutLine[]
  subtotalCents: number
  discountCents: number
  promoCode: AppliedPromoCode | null
  shippingCents: number
  totalCents: number
  taxes: { rate: number; baseCents: number; taxCents: number }[]
  shippingAddress: ShippingAddress | null
  createdAt: string
}

/** Valores del formulario de dirección del checkout. */
export interface AddressValues {
  fullName: string
  street: string
  city: string
  postalCode: string
  province: string
  phone: string
  notes: string
}
