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
