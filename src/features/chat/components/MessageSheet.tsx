import { CornerUpLeft, X } from 'lucide-react-native'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { haptics } from '@/shared/feedback'
import { radius, spacing } from '@/shared/theme/tokens'
import { REACTIONS } from '../lib/reactions'
import { chatTexts as t } from '../texts'
import type { ChatMessage, ChatReactionKind } from '../api/chat-api'

/**
 * Acciones de un mensaje: reaccionar o citarlo.
 *
 * En el móvil no hay "pasar el ratón por encima", así que se abre manteniendo
 * pulsado el mensaje. Sale desde abajo, que es donde está el pulgar.
 */
export function MessageSheet({
  message,
  onClose,
  onReact,
  onReply,
}: {
  message: ChatMessage | null
  onClose: () => void
  onReact: (kind: ChatReactionKind) => void
  onReply: () => void
}) {
  const colors = useColors()
  const mine = message?.reactions.find((one) => !one.userId)?.kind ?? null

  return (
    <Modal
      visible={message !== null}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View entering={FadeIn.duration(150)} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t.cancelReply} />

        <Animated.View
          entering={SlideInDown.duration(200)}
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.reactions}>
            {REACTIONS.map(({ kind, icon: Icon, label }) => (
              <Pressable
                key={kind}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: mine === kind }}
                onPress={() => {
                  void haptics.trigger('selection')
                  onReact(kind)
                }}
                style={({ pressed }) => [
                  styles.reaction,
                  mine === kind && { backgroundColor: colors.muted },
                  pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
                ]}
              >
                <Icon size={22} color={mine === kind ? colors.primary : colors.foreground} />
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onReply}
            style={({ pressed }) => [
              styles.action,
              { borderTopColor: colors.border },
              pressed && { opacity: 0.6 },
            ]}
          >
            <CornerUpLeft size={18} color={colors.foreground} />
            <AppText>{t.reply}</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.action,
              { borderTopColor: colors.border },
              pressed && { opacity: 0.6 },
            ]}
          >
            <X size={18} color={colors.mutedForeground} />
            <AppText variant="muted">{t.cancelReply}</AppText>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  reaction: { padding: spacing.sm, borderRadius: radius.lg },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
