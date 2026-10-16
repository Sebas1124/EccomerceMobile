import type { CatalogProduct } from '@/features/catalog'
import type { ContactSettings } from '@/features/app-config'

/** Espejo de `LandingSectionType` del backend. */
export type LandingSectionType =
  | 'HERO'
  | 'PRODUCT_CAROUSEL'
  | 'CATEGORY_GRID'
  | 'BANNER'
  | 'NEWS'
  | 'VIDEO'
  | 'RICH_TEXT'
  | 'ABOUT'
  | 'FEATURED_PRODUCT'
  | 'BRANDS'
  | 'CONTACT'

export interface HeroConfig {
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
}

export interface BannerConfig {
  text: string
  ctaLabel?: string | null
  ctaHref?: string | null
  tone: 'default' | 'primary'
}

export interface ProductCarouselConfig {
  title?: string | null
  source: 'latest' | 'category' | 'best-sellers'
  limit: number
}

export interface CategoryGridConfig {
  title?: string | null
  limit: number
}

export interface RichTextConfig {
  title?: string | null
  html: string
}

export interface AboutConfig {
  title: string
  /** Texto plano: cada línea en blanco separa un párrafo. */
  body: string
  imageUrl?: string | null
  imageSide: 'left' | 'right'
  ctaLabel?: string | null
  ctaHref?: string | null
}

export interface FeaturedProductConfig {
  title?: string | null
  productId: string
  pitch?: string | null
}

export interface BrandsConfig {
  title?: string | null
  items: { name: string; imageUrl: string; href?: string | null }[]
  speedSeconds: number
  animate: boolean
}

export interface ContactConfig {
  title?: string | null
  subtitle?: string | null
}

export type SectionConfig =
  | HeroConfig
  | BannerConfig
  | ProductCarouselConfig
  | CategoryGridConfig
  | RichTextConfig
  | AboutConfig
  | FeaturedProductConfig
  | BrandsConfig
  | ContactConfig

export interface LandingCategory {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

/** Sección con sus datos ya resueltos por el servidor. */
export interface ResolvedSection {
  id: string
  type: LandingSectionType
  config: SectionConfig
  data: {
    products?: CatalogProduct[]
    product?: CatalogProduct
    categories?: LandingCategory[]
    contact?: ContactSettings
  }
}
