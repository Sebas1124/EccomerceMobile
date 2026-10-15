import type { SpecRow } from '@/shared/components/SpecsList'

/** Espejo de los tipos públicos del catálogo de la web. */

export interface AppliedPromotion {
  id: string
  name: string
  discountCents: number
}

export interface CatalogCategoryRef {
  id: string
  name: string
  slug: string
}

/** Tarjeta del listado. */
export interface CatalogProduct {
  id: string
  name: string
  slug: string
  brand: string | null
  vatRate: number
  category: CatalogCategoryRef
  imageUrl: string | null
  priceFromCents: number
  /** El más caro. Igual al de arriba cuando solo hay una variante. */
  priceToCents: number
  /** El más barato ya con la promoción aplicada. */
  finalPriceFromCents: number
  /** El más caro ya con la promoción aplicada. */
  finalPriceToCents: number
  variantCount: number
  /** Nombres de las variantes (hasta cuatro). Vacío con una sola. */
  variantNames: string[]
  promotion: AppliedPromotion | null
  compareAtCents: number | null
  available: boolean
}

export interface CatalogVariant {
  id: string
  sku: string
  name: string
  priceCents: number
  finalPriceCents: number
  promotion: AppliedPromotion | null
  compareAtCents: number | null
  weightGrams: number | null
  position: number
  isActive: boolean
  /** Unidades que se pueden comprar ahora mismo. */
  available: number
}

export interface CatalogMedia {
  id: string
  url: string
  alt: string | null
  kind: 'IMAGE' | 'VIDEO'
  position: number
}

/** Ficha pública de producto. */
export interface CatalogProductDetail {
  id: string
  name: string
  slug: string
  description: string | null
  brand: string | null
  vatRate: number
  category: CatalogCategoryRef
  variants: CatalogVariant[]
  media: CatalogMedia[]
  /** Ficha técnica: ingredientes, alérgenos, especificaciones... */
  specs: SpecRow[]
}

export interface CategoryNode {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  position: number
  children: CategoryNode[]
}

export type CatalogSort = 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre'
