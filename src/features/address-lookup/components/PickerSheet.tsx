import { Check, Loader, Search, X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native'
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { haptics } from '@/shared/feedback/haptics'
import { radius, spacing } from '@/shared/theme/tokens'
import { addressTexts as t } from '../texts'

export interface PickerOption {
  key: string
  title: string
  /** A la derecha, en pequeño: provincia, recargo… */
  meta?: string
  selected?: boolean
}

/**
 * Hoja inferior para elegir de una lista larga.
 *
 * En el móvil un desplegable con ocho mil municipios no se puede usar, y los
 * selectores nativos no filtran. Así que se sube una hoja con buscador y la
 * lista ocupa la pantalla, que es la única forma de encontrar algo con el
 * pulgar.
 */
export function PickerSheet({
  open,
  title,
  searchLabel,
  query,
  onQuery,
  items,
  loading,
  empty,
  footer,
  onPick,
  onClose,
}: {
  open: boolean
  title: string
  searchLabel: string
  query: string
  onQuery: (value: string) => void
  items: PickerOption[]
  loading?: boolean
  /** Qué poner cuando no hay nada que enseñar. */
  empty?: ReactNode
  /** Debajo de la lista: crédito del callejero, "usar lo escrito"… */
  footer?: ReactNode
  onPick: (key: string) => void
  onClose: () => void
}) {
  const colors = useColors()

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(150)}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t.close} />

        <Animated.View
          entering={SlideInDown.duration(220)}
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.header}>
            <AppText variant="subtitle" style={{ flex: 1 }}>
              {title}
            </AppText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t.close} hitSlop={10}>
              <X color={colors.mutedForeground} size={20} />
            </Pressable>
          </View>

          <View style={[styles.search, { borderColor: colors.input, backgroundColor: colors.background }]}>
            <Search color={colors.mutedForeground} size={16} />
            <TextInput
              value={query}
              onChangeText={onQuery}
              placeholder={searchLabel}
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel={searchLabel}
              autoCorrect={false}
              autoFocus
              style={[styles.input, { color: colors.foreground }]}
            />
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ListEmptyComponent={
              loading ? (
                <View style={styles.state}>
                  <Loader color={colors.mutedForeground} size={16} />
                  <AppText variant="muted">{t.city.searching}</AppText>
                </View>
              ) : (
                <View style={styles.state}>{empty}</View>
              )
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void haptics.trigger('selection')
                  onPick(item.key)
                }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.muted }]}
              >
                <Check color={item.selected ? colors.primary : 'transparent'} size={16} />
                <AppText style={{ flex: 1 }} numberOfLines={1}>
                  {item.title}
                </AppText>
                {item.meta && (
                  <AppText variant="muted" style={{ fontSize: 12 }} numberOfLines={1}>
                    {item.meta}
                  </AppText>
                )}
              </Pressable>
            )}
          />

          {footer}
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: spacing.md, fontSize: 15 },
  list: { flexGrow: 0 },
  state: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
})
