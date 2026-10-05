import { CircleHelp, Trash2, TriangleAlert } from 'lucide-react-native'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { radius, spacing } from '@/shared/theme/tokens'
import { useConfirmStore } from './confirm-store'
import { notify } from './notify'

/** Único diálogo de confirmación de la app. Se monta una vez en el layout raíz; se usa con `confirm()`. */
export function ConfirmDialogHost() {
  const pending = useConfirmStore((s) => s.pending)
  const busy = useConfirmStore((s) => s.busy)
  const settle = useConfirmStore((s) => s.settle)
  const colors = useColors()

  const tone = pending?.tone ?? 'default'
  const toneColor =
    tone === 'danger' ? colors.destructive : tone === 'warning' ? colors.warning : colors.primary
  const Icon = pending?.icon ?? (tone === 'danger' ? Trash2 : tone === 'warning' ? TriangleAlert : CircleHelp)
  const defaultLabel = tone === 'danger' ? 'Eliminar' : tone === 'warning' ? 'Continuar' : 'Confirmar'
  const cancel = () => !busy && void settle(false)

  return (
    <Modal
      visible={pending !== null}
      transparent
      animationType="none"
      onRequestClose={cancel}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(150)}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={cancel} accessibilityLabel="Cancelar" />
        <Animated.View
          entering={ZoomIn.springify().damping(18)}
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.icon, { backgroundColor: `${toneColor}26` }]}>
            <Icon color={toneColor} size={26} />
          </View>
          <AppText variant="subtitle" style={styles.center}>
            {pending?.title}
          </AppText>
          {pending?.description && (
            <AppText variant="muted" style={styles.center}>
              {pending.description}
            </AppText>
          )}
          <View style={styles.actions}>
            <Button
              label={pending?.confirmLabel ?? defaultLabel}
              variant={tone === 'danger' ? 'destructive' : 'primary'}
              loading={busy}
              onPress={() => void settle(true).catch((error: unknown) => notify.fromError(error))}
            />
            <Button
              label={pending?.cancelLabel ?? 'Cancelar'}
              variant="outline"
              disabled={busy}
              onPress={cancel}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  dialog: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  icon: { width: 52, height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },
})
