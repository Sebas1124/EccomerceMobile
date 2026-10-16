import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ArrowRight, Clock, MapPin, MessageCircle, Phone } from 'lucide-react-native'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import { useColors } from '@/features/theme'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { RichText } from '@/shared/components/RichText'
import { formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { BrandsStrip } from './BrandsStrip'
import type {
  AboutConfig,
  BannerConfig,
  BrandsConfig,
  ContactConfig,
  FeaturedProductConfig,
  HeroConfig,
  ProductCarouselConfig,
  ResolvedSection,
  RichTextConfig,
} from '../types'

/**
 * Lleva a donde apunte un enlace de la portada.
 *
 * Los enlaces se escriben en el panel pensando en la web ("/catalogo",
 * "/novedades"). En la app esas rutas no existen tal cual, así que lo externo
 * se abre en el navegador y lo interno se traduce a lo que sí hay.
 */
function go(href: string) {
  if (/^https?:\/\//.test(href)) {
    void Linking.openURL(href)
    return
  }
  if (href.startsWith('/catalogo')) {
    router.push('/catalog')
    return
  }
  // Lo que no se sabe traducir lleva al catálogo, que es lo más parecido a
  // "sigue comprando" y nunca deja a nadie en una pantalla vacía.
  router.push('/catalog')
}

function Hero({ config }: { config: HeroConfig }) {
  const colors = useColors()

  return (
    <View
      style={{
        borderRadius: radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      {config.imageUrl && (
        <Image
          source={{ uri: config.imageUrl }}
          contentFit="cover"
          transition={180}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
        />
      )}
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <AppText variant="title">{config.title}</AppText>
        {config.subtitle && <AppText variant="muted">{config.subtitle}</AppText>}
        {config.ctaLabel && config.ctaHref && (
          <Button
            label={config.ctaLabel}
            icon={ArrowRight}
            fullWidth={false}
            onPress={() => go(config.ctaHref!)}
          />
        )}
      </View>
    </View>
  )
}

function Banner({ config }: { config: BannerConfig }) {
  const colors = useColors()
  const strong = config.tone === 'primary'

  return (
    <Pressable
      accessibilityRole={config.ctaHref ? 'button' : undefined}
      disabled={!config.ctaHref}
      onPress={() => config.ctaHref && go(config.ctaHref)}
      style={{
        backgroundColor: strong ? colors.primary : colors.muted,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.xs,
      }}
    >
      <AppText style={{ color: strong ? colors.primaryForeground : colors.foreground }}>
        {config.text}
      </AppText>
      {config.ctaLabel && (
        <AppText
          style={{
            fontWeight: '600',
            color: strong ? colors.primaryForeground : colors.primary,
          }}
        >
          {config.ctaLabel}
        </AppText>
      )}
    </Pressable>
  )
}

function About({ config }: { config: AboutConfig }) {
  const paragraphs = config.body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <View style={{ gap: spacing.md }}>
      {/* En una columna "izquierda" y "derecha" no significan nada: la imagen
          va siempre arriba. */}
      {config.imageUrl && (
        <Image
          source={{ uri: config.imageUrl }}
          contentFit="cover"
          transition={180}
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.xl }}
        />
      )}
      <AppText variant="title">{config.title}</AppText>
      <View style={{ gap: spacing.sm }}>
        {paragraphs.map((text, index) => (
          <AppText key={index} variant="muted">
            {text}
          </AppText>
        ))}
      </View>
      {config.ctaLabel && config.ctaHref && (
        <Button
          label={config.ctaLabel}
          variant="outline"
          fullWidth={false}
          onPress={() => go(config.ctaHref!)}
        />
      )}
    </View>
  )
}

function Featured({
  config,
  product,
}: {
  config: FeaturedProductConfig
  product: NonNullable<ResolvedSection['data']['product']>
}) {
  const colors = useColors()

  return (
    <Card>
      {config.title && (
        <AppText variant="muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>
          {config.title}
        </AppText>
      )}
      {product.imageUrl && (
        <Image
          source={{ uri: product.imageUrl }}
          contentFit="cover"
          transition={180}
          style={{ width: '100%', aspectRatio: 1, borderRadius: radius.lg }}
        />
      )}
      <AppText variant="title">{product.name}</AppText>
      {config.pitch ? (
        <AppText variant="muted">{config.pitch}</AppText>
      ) : (
        product.brand && <AppText variant="muted">{product.brand}</AppText>
      )}
      <AppText variant="subtitle" style={{ color: colors.primary }}>
        {formatPrice(product.finalPriceFromCents)}
      </AppText>
      <Button
        label="Ver el producto"
        icon={ArrowRight}
        haptic="selection"
        onPress={() => router.push({ pathname: '/producto/[slug]', params: { slug: product.slug } })}
      />
    </Card>
  )
}

function Contact({
  config,
  contact,
}: {
  config: ContactConfig
  contact: NonNullable<ResolvedSection['data']['contact']>
}) {
  const colors = useColors()

  return (
    <Card title={config.title ?? 'Hablamos'} description={config.subtitle ?? undefined}>
      {contact.phone && (
        <Pressable
          accessibilityRole="link"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
          onPress={() => void Linking.openURL(`tel:${contact.phone.replace(/\s/g, '')}`)}
        >
          <Phone color={colors.mutedForeground} size={16} />
          <AppText>{contact.phone}</AppText>
        </Pressable>
      )}
      {contact.location && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <MapPin color={colors.mutedForeground} size={16} />
          <AppText variant="muted">{contact.location}</AppText>
        </View>
      )}
      {contact.hours.length > 0 && (
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Clock color={colors.mutedForeground} size={16} />
            <AppText style={{ fontWeight: '500' }}>Horario de atención</AppText>
          </View>
          {contact.hours.map((row) => (
            <View
              key={`${row.label}-${row.value}`}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <AppText variant="muted" style={{ fontSize: 13 }}>
                {row.label}
              </AppText>
              <AppText style={{ fontSize: 13 }}>{row.value}</AppText>
            </View>
          ))}
        </View>
      )}
      {contact.whatsapp && (
        <Button
          label="Escríbenos por WhatsApp"
          icon={MessageCircle}
          haptic="selection"
          onPress={() => void Linking.openURL(`https://wa.me/${contact.whatsapp}`)}
        />
      )}
    </Card>
  )
}

function ProductRow({
  config,
  products,
}: {
  config: ProductCarouselConfig
  products: NonNullable<ResolvedSection['data']['products']>
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {config.title && <AppText variant="subtitle">{config.title}</AppText>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.md }}
      >
        {products.map((product) => (
          <View key={product.id} style={{ width: 160 }}>
            <ProductCard product={product} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

/**
 * Pinta una sección de la portada según su tipo.
 *
 * Lo que no encaje —novedades y vídeo, que todavía no tienen pantalla en la
 * app— simplemente no se pinta, igual que en la web. Es preferible a inventar
 * una pantalla a medias por rellenar el hueco.
 */
export function LandingSectionView({ section }: { section: ResolvedSection }) {
  switch (section.type) {
    case 'HERO':
      return <Hero config={section.config as HeroConfig} />
    case 'BANNER':
      return <Banner config={section.config as BannerConfig} />
    case 'ABOUT':
      return <About config={section.config as AboutConfig} />
    case 'BRANDS':
      return <BrandsStrip config={section.config as BrandsConfig} />
    case 'RICH_TEXT': {
      const config = section.config as RichTextConfig
      return (
        <View style={{ gap: spacing.sm }}>
          {config.title && <AppText variant="subtitle">{config.title}</AppText>}
          <RichText html={config.html} />
        </View>
      )
    }
    case 'FEATURED_PRODUCT':
      return section.data.product ? (
        <Featured config={section.config as FeaturedProductConfig} product={section.data.product} />
      ) : null
    case 'CONTACT':
      return section.data.contact ? (
        <Contact config={section.config as ContactConfig} contact={section.data.contact} />
      ) : null
    case 'PRODUCT_CAROUSEL':
      return section.data.products?.length ? (
        <ProductRow config={section.config as ProductCarouselConfig} products={section.data.products} />
      ) : null
    default:
      return null
  }
}
