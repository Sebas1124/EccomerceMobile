import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ProductPolicyCard } from '@/features/after-sales'
import { AddToCartButton } from '@/features/cart'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { notify } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import { catalogApi } from '../api/catalog-api'
import { PriceTag } from '../components/PriceTag'
import { ProductGallery } from '../components/ProductGallery'
import { QuantityStepper } from '../components/QuantityStepper'
import { catalogTexts as t } from '../texts'
import type { CatalogProductDetail } from '../types'

/** Cuánto asoma la hoja de contenido por encima de la foto. */
const SHEET_OVERLAP = 28

/** Tope por línea que aplica el servidor; el selector no ofrece más. */
const MAX_QTY_PER_ITEM = 99

/** Selector de variante: un botón por opción, apagado si está agotada. */
function VariantPicker({
  product,
  selectedId,
  onSelect,
}: {
  product: CatalogProductDetail
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const colors = useColors()
  if (product.variants.length <= 1) return null

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label">{t.chooseVariant}</AppText>
      <View style={styles.variants}>
        {product.variants.map((variant) => {
          const active = variant.id === selectedId
          const soldOut = variant.available <= 0
          return (
            <Pressable
              key={variant.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: soldOut }}
              disabled={soldOut}
              onPress={() => onSelect(variant.id)}
              style={({ pressed }) => [
                styles.variant,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: soldOut ? 0.4 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <AppText
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: active ? colors.primaryForeground : colors.foreground,
                }}
              >
                {variant.name}
                {soldOut ? ` · ${t.soldOut}` : ''}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

/**
 * Ficha de producto. La foto ocupa todo el ancho y se queda detrás mientras la
 * hoja de contenido sube por encima al hacer scroll; el botón de comprar vive
 * en una barra fija, para no tener que volver arriba a buscarlo.
 */
export function ProductScreen() {
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const [product, setProduct] = useState<CatalogProductDetail | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [mediaId, setMediaId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)

  const heroHeight = Math.round(width * 1.05)
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y)
  })

  /**
   * La foto se mueve a menos velocidad que el contenido y se estira al tirar
   * hacia abajo: da profundidad sin tapar nada. No se atenúa al subir, porque
   * al hacerlo dejaba una banda gris entre el borde de la hoja y la pantalla.
   */
  const heroStyle = useAnimatedStyle(() => {
    const y = scrollY.get()
    return {
      transform: [
        { translateY: interpolate(y, [0, heroHeight], [0, heroHeight * 0.4], {
            extrapolateLeft: Extrapolation.CLAMP,
          }) },
        { scale: interpolate(y, [-heroHeight, 0], [2, 1], {
            extrapolateRight: Extrapolation.CLAMP,
          }) },
      ],
    }
  })

  useEffect(() => {
    if (!slug) return
    let alive = true
    catalogApi
      .detail(slug)
      .then(({ product: loaded }) => {
        if (!alive) return
        setProduct(loaded)
        // Se preselecciona la primera variante con existencias.
        const first = loaded.variants.find((variant) => variant.available > 0) ?? loaded.variants[0]
        setVariantId(first?.id ?? null)
        setMediaId(loaded.media[0]?.id ?? null)
      })
      .catch((error: unknown) => notify.fromError(error, t.detailError))
    return () => {
      alive = false
    }
  }, [slug])

  if (!product) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  const variant = product.variants.find((item) => item.id === variantId) ?? null
  const media = product.media.find((item) => item.id === mediaId) ?? product.media[0] ?? null
  const soldOut = !variant || variant.available <= 0
  // La variante elegida puede tener menos existencias que la anterior: lo que
  // se pide nunca puede pasar de lo que hay.
  const maxQty = variant ? Math.min(variant.available, MAX_QTY_PER_ITEM) : 1
  const safeQty = Math.min(Math.max(qty, 1), Math.max(maxQty, 1))

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* La foto vive detrás de todo: la hoja se desliza por encima. */}
      <Animated.View style={[styles.hero, { height: heroHeight }, heroStyle]}>
        {media ? (
          <Image
            source={{ uri: media.url }}
            style={styles.heroImage}
            // `contain`, no `cover`: las fotos de producto vienen recortadas y
            // rellenar el hueco significaría cortarle un trozo al producto.
            contentFit="contain"
            transition={250}
            accessibilityLabel={media.alt ?? product.name}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: colors.muted }]} />
        )}
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        {/* Hueco transparente del alto de la foto: por debajo se ve el hero. */}
        <View style={{ height: heroHeight - SHEET_OVERLAP }} />

        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <ProductGallery media={product.media} selectedId={mediaId} onSelect={setMediaId} />

          <View style={{ gap: spacing.xs }}>
            <AppText variant="muted" style={{ fontSize: 13 }}>
              {product.category.name}
            </AppText>
            <AppText variant="title">{product.name}</AppText>
            {product.brand && <AppText variant="muted">{product.brand}</AppText>}
          </View>

          <View style={{ gap: spacing.xs }}>
            <PriceTag
              size="lg"
              priceCents={variant?.priceCents ?? 0}
              finalPriceCents={variant?.finalPriceCents}
              promotion={variant?.promotion}
              compareAtCents={variant?.compareAtCents}
            />
            <AppText variant="muted" style={{ fontSize: 13 }}>
              {t.vatIncluded}
            </AppText>
          </View>

          <VariantPicker
            product={product}
            selectedId={variantId}
            onSelect={(id) => {
              setVariantId(id)
              // Cada variante tiene su stock: se vuelve a empezar en una unidad.
              setQty(1)
            }}
          />

          {!soldOut && (
            <QuantityStepper value={safeQty} max={maxQty} onChange={setQty} />
          )}

          {variant && (
            <View style={styles.stock}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: soldOut ? colors.destructive : colors.success },
                ]}
              />
              <AppText style={{ fontSize: 14 }}>
                {soldOut
                  ? t.soldOut
                  : variant.available <= 5
                    ? t.lastUnits(variant.available)
                    : t.available}
              </AppText>
              <AppText variant="muted" style={{ fontSize: 12 }}>
                · {t.sku(variant.sku)}
              </AppText>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">{t.description}</AppText>
            <AppText variant="muted" style={{ lineHeight: 22 }}>
              {product.description ?? t.noDescription}
            </AppText>
          </View>

          <ProductPolicyCard productId={product.id} />
        </View>
      </Animated.ScrollView>

      {/* Volver flota sobre la foto, que puede ser de cualquier color. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.back}
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.back,
          {
            top: insets.top + spacing.sm,
            backgroundColor: colors.overlay,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <ChevronLeft color="#ffffff" size={24} />
      </Pressable>

      {/* Comprar siempre a mano, sin tener que volver arriba. */}
      <View
        style={[
          styles.bar,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.barPrice}>
          <AppText variant="muted" numberOfLines={1} style={{ fontSize: 12 }}>
            {variant?.name ?? product.name}
          </AppText>
          <PriceTag
            size="sm"
            priceCents={variant?.priceCents ?? 0}
            finalPriceCents={variant?.finalPriceCents}
            compareAtCents={variant?.compareAtCents}
          />
        </View>

        {variant && (
          <View style={styles.barAction}>
            <AddToCartButton
              disabled={soldOut}
              // Vuelve a una unidad para no añadir el mismo lote sin querer.
              onAdded={() => setQty(1)}
              line={{
                variantId: variant.id,
                qty: safeQty,
                snapshot: {
                  productName: product.name,
                  productSlug: product.slug,
                  variantName: variant.name,
                  sku: variant.sku,
                  // Se guarda el precio ya rebajado: el invitado paga lo que ve.
                  priceCents: variant.finalPriceCents,
                  vatRate: product.vatRate,
                  imageUrl: product.media[0]?.url ?? null,
                },
              }}
            />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Fondo blanco: casi todas las fotos de producto vienen recortadas sobre blanco.
  hero: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#ffffff' },
  heroImage: { width: '100%', height: '100%' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    gap: spacing.lg,
    minHeight: 420,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.full },
  variants: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  variant: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  stock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  divider: { height: 1 },
  back: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  barPrice: { flex: 1, gap: 2 },
  barAction: { flex: 1.3 },
})
