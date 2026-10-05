import { Search } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { notify } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import { catalogApi } from '../api/catalog-api'
import { ProductCard } from '../components/ProductCard'
import { catalogTexts as t } from '../texts'
import type { CatalogProduct, CatalogSort, CategoryNode } from '../types'

const PAGE_SIZE = 20
const SORTS: CatalogSort[] = ['recientes', 'precio-asc', 'precio-desc', 'nombre']

/** Columnas de la rejilla. El ancho de cada celda se calcula a partir de esto. */
const COLUMNS = 2

/** Espera a que el usuario deje de escribir antes de pedir al servidor. */
function useDebounced(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Chip de filtro: categoría u orden. */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const colors = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText
        style={{
          fontSize: 13,
          fontWeight: '500',
          color: active ? colors.primaryForeground : colors.foreground,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  )
}

export function CatalogScreen() {
  const colors = useColors()
  const { width } = useWindowDimensions()
  /**
   * Ancho de celda en píxeles. Se calcula en vez de repartirlo con `flex`
   * porque el reparto dependía de cómo envolviera la fila cada plataforma, y
   * en iOS la segunda tarjeta se quedaba fuera de la pantalla.
   */
  const cellWidth = Math.floor(
    (width - spacing.lg * 2 - spacing.md * (COLUMNS - 1)) / COLUMNS,
  )
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search)
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<CatalogSort>('recientes')
  const [categories, setCategories] = useState<CategoryNode[]>([])

  // El resultado se guarda junto a la consulta que lo produjo: así se sabe si
  // lo cargado corresponde a los filtros actuales sin tocar estado en el efecto.
  const [loaded, setLoaded] = useState<{
    key: string
    items: CatalogProduct[]
    total: number
    page: number
  } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [reload, setReload] = useState(0)

  const query = {
    search: debouncedSearch.trim() || undefined,
    category: category ?? undefined,
    sort,
  }
  const queryKey = `${query.search ?? ''}|${query.category ?? ''}|${sort}|${reload}`
  const ready = loaded?.key === queryKey
  const items = ready ? loaded.items : []
  const total = ready ? loaded.total : 0

  useEffect(() => {
    let alive = true
    catalogApi
      .categories()
      .then(({ items: tree }) => {
        if (alive) setCategories(tree)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  // Cambiar filtros vuelve a la primera página: mezclarlas no tendría sentido.
  useEffect(() => {
    let alive = true
    catalogApi
      .list({ ...query, page: 1, pageSize: PAGE_SIZE })
      .then((data) => {
        if (alive) setLoaded({ key: queryKey, items: data.items, total: data.total, page: 1 })
      })
      .catch((error: unknown) => notify.fromError(error, t.loadError))
    return () => {
      alive = false
    }
    // `queryKey` resume los filtros; rehacer el objeto en cada render no cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  /** Carga la página siguiente y la añade a la lista. */
  const loadMore = useCallback(async () => {
    if (!ready || loadingMore || loaded.items.length >= loaded.total) return
    setLoadingMore(true)
    try {
      const next = loaded.page + 1
      const data = await catalogApi.list({ ...query, page: next, pageSize: PAGE_SIZE })
      setLoaded((current) =>
        // Si los filtros cambiaron mientras llegaba, esta página ya no vale.
        current?.key === queryKey
          ? { ...current, items: [...current.items, ...data.items], page: next }
          : current,
      )
    } catch (error) {
      notify.fromError(error, t.loadError)
    } finally {
      setLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loadingMore, loaded, queryKey])

  const clearFilters = () => {
    setSearch('')
    setCategory(null)
    setSort('recientes')
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(product) => product.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        refreshing={!ready}
        onRefresh={() => setReload((value) => value + 1)}
        onEndReachedThreshold={0.4}
        onEndReached={() => void loadMore()}
        renderItem={({ item }) => (
          // La celda manda: ancho fijo, así una fila impar tampoco deja la
          // última tarjeta a doble ancho.
          <View style={{ width: cellWidth }}>
            <ProductCard product={item} />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search color={colors.mutedForeground} size={18} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                returnKeyType="search"
                accessibilityLabel={t.searchPlaceholder}
              />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: 'all', name: t.allCategories, slug: '' } as const, ...categories]}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => (
                <Chip
                  label={item.name}
                  active={item.slug === (category ?? '')}
                  onPress={() => setCategory(item.slug || null)}
                />
              )}
            />

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={SORTS}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => (
                <Chip
                  label={t.sortOptions[item]}
                  active={item === sort}
                  onPress={() => setSort(item)}
                />
              )}
            />

            {total > 0 && (
              <AppText variant="muted" style={{ paddingHorizontal: spacing.lg }}>
                {t.results(total)}
              </AppText>
            )}
          </View>
        }
        ListEmptyComponent={
          !ready ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
          ) : (
            <View style={styles.empty}>
              <AppText variant="muted" style={{ textAlign: 'center' }}>
                {t.empty}
              </AppText>
              <Button label={t.emptyAction} variant="outline" fullWidth={false} onPress={clearFilters} />
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl, gap: spacing.md },
  header: { gap: spacing.md, paddingTop: spacing.md },
  column: { gap: spacing.md, paddingHorizontal: spacing.lg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: 15 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderRadius: radius.full },
  empty: { padding: spacing.xxl, gap: spacing.lg, alignItems: 'center' },
})
