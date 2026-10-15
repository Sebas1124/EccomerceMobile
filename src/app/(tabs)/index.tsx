import { router } from 'expo-router'
import { ArrowRight, Search, Sparkles } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { FeatureKey, useAppConfigStore, useFeature } from '@/features/app-config'
import { LandingSectionView, landingApi, type ResolvedSection } from '@/features/landing'
import { catalogApi, type CatalogProduct } from '@/features/catalog'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Screen } from '@/shared/components/Screen'
import { texts } from '@/shared/constants/texts'
import { haptics } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import type { CategoryNode } from '@/features/catalog/types'

/** Lo que cabe en una fila horizontal sin que se haga eterna. */
const FEATURED = 6

/**
 * Portada de la tienda.
 *
 * Antes aquí había una lista de banderas de funcionalidades: un andamio de
 * desarrollo que no le dice nada a quien abre la app para comprar. Ahora enseña
 * lo que de verdad hay: el nombre de la tienda, por dónde empezar a buscar,
 * las categorías y los últimos productos.
 *
 * No depende de que el administrador haya configurado nada: con una tienda
 * recién montada se ve igual de digna, solo que con menos cosas.
 */
export default function HomeScreen() {
  const colors = useColors()
  const branding = useAppConfigStore((s) => s.config.branding)
  const [products, setProducts] = useState<CatalogProduct[] | null>(null)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  /**
   * La portada que ha montado la tienda desde el panel.
   *
   * `null` mientras se pide, `[]` si no hay ninguna. La diferencia importa: con
   * `[]` se enseña la portada de siempre, y con `null` todavía no se sabe.
   */
  const [fetched, setFetched] = useState<ResolvedSection[] | null>(null)
  const landingOn = useFeature(FeatureKey.LandingBuilder)

  useEffect(() => {
    let alive = true
    Promise.all([
      catalogApi.list({ page: 1, pageSize: FEATURED, sort: 'recientes' }),
      catalogApi.categories(),
    ])
      .then(([listado, arbol]) => {
        if (!alive) return
        setProducts(listado.items)
        setCategories(arbol.items)
      })
      // Sin red la portada se queda con el saludo y el acceso al catálogo:
      // sigue siendo una pantalla, no un error.
      .catch(() => {
        if (alive) setProducts([])
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!landingOn) return
    let alive = true
    landingApi
      .sections()
      .then(({ sections: loaded }) => {
        if (alive) setFetched(loaded)
      })
      // Sin portada montada queda la de siempre: categorías y novedades.
      .catch(() => {
        if (alive) setFetched([])
      })
    return () => {
      alive = false
    }
  }, [landingOn])

  /**
   * Derivado en vez de guardado: con la funcionalidad apagada no hay portada
   * que pedir, y apagarlo con un `setState` dentro del efecto encadenaría
   * renders.
   */
  const sections = landingOn ? fetched : []

  const goCatalog = (category?: string) => {
    void haptics.trigger('selection')
    router.push(category ? { pathname: '/catalog', params: { category } } : '/catalog')
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs, paddingTop: spacing.lg }}>
        <AppText variant="title">{texts.home.heroTitle(branding.appName)}</AppText>
        <AppText variant="muted">{texts.home.heroSubtitle}</AppText>
      </View>

      {/* Acceso al catálogo con aspecto de buscador: es lo primero que se busca. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={texts.home.search}
        onPress={() => goCatalog()}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          marginTop: spacing.lg,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Search size={18} color={colors.mutedForeground} />
        <AppText variant="muted" style={{ flex: 1 }}>
          {texts.home.search}
        </AppText>
        <ArrowRight size={16} color={colors.mutedForeground} />
      </Pressable>

      {/*
        La portada que haya montado la tienda. Cuando hay secciones, son ellas
        las que dan carácter a esta pantalla; cuando no hay ninguna, se queda lo
        de siempre (categorías y últimos productos), que sigue siendo una
        portada digna para una tienda recién abierta.
      */}
      {sections?.map((section) => (
        <View key={section.id} style={{ marginTop: spacing.xl }}>
          <LandingSectionView section={section} />
        </View>
      ))}

      {sections?.length === 0 && categories.length > 0 && (
        <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
          <AppText variant="subtitle">{texts.home.categories}</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {categories.map((category) => (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                onPress={() => goCatalog(category.slug)}
                style={({ pressed }) => ({
                  backgroundColor: colors.muted,
                  borderRadius: radius.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <AppText style={{ fontSize: 14 }}>{category.name}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Las novedades solo cuando la tienda no ha montado portada propia: si
          la ha montado, ya decide ella qué productos enseñar y en qué orden. */}
      {sections?.length === 0 && (
        <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Sparkles size={16} color={colors.primary} />
            <AppText variant="subtitle">{texts.home.featured}</AppText>
          </View>

          {products === null ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {Array.from({ length: 4 }, (_, index) => (
                <View
                  key={index}
                  style={{
                    width: '47%',
                    aspectRatio: 0.8,
                    borderRadius: radius.lg,
                    backgroundColor: colors.muted,
                  }}
                />
              ))}
            </View>
          ) : products.length === 0 ? (
            <AppText variant="muted">{texts.home.empty}</AppText>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {products.map((product) => (
                <View key={product.id} style={{ width: '47%' }}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {sections?.length === 0 && products !== null && products.length > 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={() => goCatalog()}
          style={({ pressed }) => ({
            alignSelf: 'center',
            marginTop: spacing.lg,
            marginBottom: spacing.xl,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <AppText style={{ color: colors.primary, fontWeight: '600' }}>{texts.home.seeAll}</AppText>
        </Pressable>
      )}
    </Screen>
  )
}
