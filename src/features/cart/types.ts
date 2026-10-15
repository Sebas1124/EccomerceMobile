import type { AppliedPromotion } from '@/features/catalog'

export interface CartLine {
  id: string
  qty: number
  variant: {
    id: string
    sku: string
    name: string
    /** Precio de catálogo, antes de promociones. */
    priceCents: number
    /** Precio que se cobra por unidad. */
    finalPriceCents: number
    compareAtCents: number | null
    available: number
    isActive: boolean
  }
  product: {
    id: string
    name: string
    slug: string
    vatRate: number
    imageUrl: string | null
    isActive: boolean
  }
  lineTotalCents: number
  discountCents: number
  promotion: AppliedPromotion | null
  /** Lo que impide comprar esta línea, si algo lo impide. */
  issue: 'unavailable' | 'not_enough_stock' | null
}

export interface CartSummary {
  id: string | null
  lines: CartLine[]
  itemCount: number
  /** Total con IVA incluido. */
  totalCents: number
  /** Base imponible. */
  subtotalCents: number
  discountCents: number
  taxes: { rate: number; baseCents: number; taxCents: number }[]
  hasIssues: boolean
  /**
   * Si el carrito llega a los mínimos de pedido. `null` con carrito de
   * invitado o cuando la tienda no tiene ninguno.
   */
  minimums: CartMinimums | null
}

/** Lo que falta para poder pasar por caja. */
export interface CartMinimums {
  met: boolean
  orderMinCents: number
  orderShortfallCents: number
  /** `true` si el mínimo de la tienda no se le aplica (ventaja de socio). */
  orderExempt: boolean
  categories: {
    categoryId: string
    name: string
    minCents: number
    subtotalCents: number
    shortfallCents: number
  }[]
}

/** Línea del carrito de invitado: se guarda en el dispositivo con lo justo para pintarla. */
export interface GuestLine {
  variantId: string
  qty: number
  snapshot: {
    productName: string
    productSlug: string
    variantName: string
    sku: string
    priceCents: number
    vatRate: number
    imageUrl: string | null
  }
}
