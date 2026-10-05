import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { haptics } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import { catalogTexts as t } from '../texts'
import type { CatalogProduct } from '../types'
import { PriceTag } from './PriceTag'

/**
 * Altura fija del texto de la tarjeta: dos líneas de nombre, una de marca y
 * una de precio. Se reserva el sitio aunque falte alguno, porque si cada
 * tarjeta midiera lo que dice su contenido la rejilla quedaría a dientes de
 * sierra.
 */
const NAME_LINE = 19
const BRAND_LINE = 17
const PRICE_LINE = 24
const BODY_HEIGHT = NAME_LINE * 2 + BRAND_LINE + PRICE_LINE + spacing.md * 2 + spacing.xs * 2

/**
 * Tarjeta del listado. Rellena el hueco que le da su celda: el ancho lo decide
 * la rejilla, no la tarjeta.
 *
 * Navega con `router.push` en vez de `Link asChild` a propósito: `Link` mete un
 * elemento propio entre la fila y la tarjeta, y ese elemento no heredaba el
 * tamaño de la celda, así que la segunda tarjeta se salía de la pantalla.
 */
export function ProductCard({ product }: { product: CatalogProduct }) {
  const colors = useColors()
  const discounted = product.finalPriceFromCents < product.priceFromCents

  const open = () => {
    void haptics.trigger('selection')
    router.push({ pathname: '/producto/[slug]', params: { slug: product.slug } })
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.name}
      onPress={open}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.imageBox}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.image, { backgroundColor: colors.muted }]} />
        )}

        {/* El descuento flota sobre la imagen: si fuera texto, descuadraría la altura. */}
        {discounted && product.promotion && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <AppText
              numberOfLines={1}
              style={{ fontSize: 11, fontWeight: '700', color: colors.primaryForeground }}
            >
              {product.promotion.name}
            </AppText>
          </View>
        )}

        {!product.available && (
          <View style={[styles.soldOut, { backgroundColor: colors.overlay }]}>
            <AppText style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>
              {t.soldOut}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <AppText numberOfLines={2} style={styles.name}>
          {product.name}
        </AppText>
        {/* Ocupa su línea tenga marca o no, para que todas las tarjetas midan igual. */}
        <AppText variant="muted" numberOfLines={1} style={styles.brand}>
          {product.brand ?? ' '}
        </AppText>
        <PriceTag
          size="sm"
          prefix={t.fromPrice}
          priceCents={product.priceFromCents}
          finalPriceCents={product.finalPriceFromCents}
          compareAtCents={product.compareAtCents}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { width: '100%', borderWidth: 1, borderRadius: radius.xl, overflow: 'hidden' },
  // Fondo blanco: casi todas las fotos de producto vienen recortadas sobre blanco.
  imageBox: { width: '100%', aspectRatio: 1, backgroundColor: '#ffffff' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    maxWidth: '85%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  soldOut: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { height: BODY_HEIGHT, padding: spacing.md, gap: spacing.xs },
  name: { fontSize: 15, lineHeight: NAME_LINE, fontWeight: '600' },
  brand: { fontSize: 12, lineHeight: BRAND_LINE },
})
