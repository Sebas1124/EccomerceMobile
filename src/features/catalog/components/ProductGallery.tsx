import { Image } from 'expo-image'
import { FlatList, Pressable, StyleSheet } from 'react-native'
import { useColors } from '@/features/theme'
import { haptics } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import type { CatalogMedia } from '../types'

const THUMB = 64

/**
 * Miniaturas para cambiar de foto a mano. Con una sola imagen no se pinta:
 * una galería de un elemento es ruido, no una galería.
 */
export function ProductGallery({
  media,
  selectedId,
  onSelect,
}: {
  media: CatalogMedia[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const colors = useColors()
  if (media.length < 2) return null

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={media}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const active = item.id === selectedId
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.alt ?? undefined}
            accessibilityState={{ selected: active }}
            onPress={() => {
              void haptics.trigger('selection')
              onSelect(item.id)
            }}
            style={({ pressed }) => [
              styles.thumb,
              {
                borderColor: active ? colors.primary : colors.border,
                borderWidth: active ? 2 : 1,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Image
              source={{ uri: item.url }}
              style={styles.image}
              contentFit="cover"
              transition={150}
              accessibilityIgnoresInvertColors
            />
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingVertical: spacing.xs },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  image: { width: '100%', height: '100%' },
})
