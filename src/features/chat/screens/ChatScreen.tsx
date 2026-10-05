import { Stack } from 'expo-router'
import { CornerUpLeft, Send, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import type { Socket } from 'socket.io-client'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Card } from '@/shared/components/Card'
import { haptics, notify } from '@/shared/feedback'
import { formatDate } from '@/shared/lib/format'
import { ApiError } from '@/shared/lib/api-client'
import { connectNamespace } from '@/shared/lib/socket'
import { radius, spacing } from '@/shared/theme/tokens'
import {
  chatApi,
  type ChatAvailability,
  type ChatMessage,
  type ChatReaction,
  type ChatReactionKind,
} from '../api/chat-api'
import { MessageSheet } from '../components/MessageSheet'
import { iconOf } from '../lib/reactions'
import { MessageTicks } from '../components/MessageTicks'
import { TypingDots } from '../components/TypingDots'
import { tickFor } from '../lib/ticks'
import { chatTexts as t } from '../texts'

/** Cuánto se enseña el aviso de "está escribiendo" sin más señales. */
const TYPING_TIMEOUT_MS = 3000

/** Tope del servidor; se corta aquí también para no mandar de más. */
const MAX_BODY = 1000

/** Si el servidor no confirma en este tiempo, se da por fallido. */
const ACK_TIMEOUT_MS = 8000

/**
 * Un aviso de "escribiendo" por segundo como mucho. Sin esto se emitiría uno
 * por tecla: el otro lado no lo nota, pero es tráfico regalado.
 */
const TYPING_THROTTLE_MS = 1000

/** Añade el mensaje si no estaba ya. */
const appendUnique = (messages: ChatMessage[] | null, message: ChatMessage) => {
  const current = messages ?? []
  return current.some((one) => one.id === message.id) ? current : [...current, message]
}

export function ChatScreen() {
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [availability, setAvailability] = useState<ChatAvailability | null>(null)
  /** Hasta cuándo ha leído la tienda: decide el doble check azul. */
  const [staffReadAt, setStaffReadAt] = useState<string | null>(null)
  /** Mensaje que se esta citando. */
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  /** Mensaje con la hoja de acciones abierta. */
  const [acting, setActing] = useState<ChatMessage | null>(null)
  /** Por que no puede chatear, cuando no puede. */
  const [denied, setDenied] = useState<'STAFF' | 'UNVERIFIED' | 'BLOCKED' | null>(null)
  const socket = useRef<Socket | null>(null)
  const conversation = useRef<string | null>(null)
  const scroll = useRef<ScrollView>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  /** Cuándo se avisó por última vez de que se está escribiendo. */
  const lastTypingAt = useRef(0)

  useEffect(() => {
    let alive = true
    let live: Socket | null = null

    const start = async () => {
      try {
        const { conversation: room, availability: state } = await chatApi.mine()
        const history = await chatApi.messages(room.id)
        if (!alive) return

        conversation.current = room.id
        setMessages(history.items)
        setStaffReadAt(history.staffReadAt)
        setAvailability(state)

        live = await connectNamespace('/chat')
        if (!alive) return live.disconnect()
        socket.current = live

        live.on('connect', () => {
          live?.emit('chat:join', room.id)
          live?.emit('chat:read', room.id)
        })

        live.on('chat:message', ({ message }: { message: ChatMessage }) => {
          setTyping(false)
          setMessages((previous) => appendUnique(previous, message))
          // Lo que se está viendo se da por leído al momento.
          if (message.fromStaff) live?.emit('chat:read', room.id)
        })

        live.on('chat:typing', ({ fromStaff }: { fromStaff: boolean }) => {
          if (!fromStaff) return
          setTyping(true)
          clearTimeout(typingTimer.current)
          typingTimer.current = setTimeout(() => setTyping(false), TYPING_TIMEOUT_MS)
        })

        // Bloqueado en caliente: el servidor avisa antes de cortar la conexión.
        live.on('chat:blocked', () => {
          setDenied('BLOCKED')
          setTyping(false)
          setReplyTo(null)
          setActing(null)
        })

        // Las reacciones llegan completas para ese mensaje: se sustituyen.
        live.on(
          'chat:reactions',
          ({ messageId, reactions }: { messageId: string; reactions: ChatReaction[] }) => {
            setMessages((previous) =>
              (previous ?? []).map((one) =>
                one.id === messageId ? { ...one, reactions } : one,
              ),
            )
          },
        )

        // La tienda ha leido: lo enviado antes pasa a doble check azul.
        live.on('chat:read', ({ fromStaff, readAt }: { fromStaff: boolean; readAt: string }) => {
          if (fromStaff) setStaffReadAt(readAt)
        })
      } catch (error) {
        if (!alive) return
        setMessages([])
        // 403 con codigo CHAT_*: no es un fallo, es que esa persona no chatea.
        const code = error instanceof ApiError ? error.code : ''
        const reason = code.startsWith('CHAT_') ? code.slice(5) : null
        if (reason === 'STAFF' || reason === 'UNVERIFIED' || reason === 'BLOCKED') {
          setDenied(reason)
          return
        }
        notify.fromError(error, t.loadError)
      }
    }

    void start()
    return () => {
      alive = false
      clearTimeout(typingTimer.current)
      live?.disconnect()
      socket.current = null
    }
  }, [])

  /** Avisa de que se está escribiendo, con freno. */
  const notifyTyping = () => {
    const now = Date.now()
    if (now - lastTypingAt.current < TYPING_THROTTLE_MS) return
    lastTypingAt.current = now
    if (socket.current?.connected && conversation.current) {
      socket.current.emit('chat:typing', conversation.current)
    }
  }

  const react = (kind: ChatReactionKind) => {
    if (acting) socket.current?.emit('chat:react', { messageId: acting.id, kind })
    setActing(null)
  }

  const send = async () => {
    const text = body.trim()
    if (!text) return

    // Sin socket vivo el mensaje no sale: hay que decirlo, no callarse.
    if (!socket.current?.connected || !conversation.current) {
      notify.error(t.offline)
      return
    }

    setSending(true)
    try {
      // `timeout` es imprescindible: si el servidor no contesta, sin él la
      // promesa se queda colgada para siempre y el botón no vuelve.
      const result = await socket.current
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('chat:message', {
          conversationId: conversation.current,
          body: text,
          replyToId: replyTo?.id ?? null,
        })
        .catch(() => ({ error: 'TIMEOUT' }) as { message?: ChatMessage; error?: string })

      if (result.error || !result.message) {
        notify.error(result.error === 'RATE_LIMITED' ? t.rateLimited : t.sendError)
        return
      }
      // El servidor devuelve el mensaje ya censurado: se añade ese, no el escrito.
      // Se comprueba el id: un mensaje no puede salir dos veces aunque llegue
      // por el acuse y por la difusión.
      setMessages((previous) => appendUnique(previous, result.message!))
      setBody('')
      // La cita se consume al enviar: no se arrastra al mensaje siguiente.
      setReplyTo(null)
      void haptics.trigger('success')
    } finally {
      setSending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      <Stack.Screen options={{ title: t.title }} />

      {/* La tienda está cerrada: se avisa, pero se deja escribir para no
          perder el mensaje del cliente. */}
      {availability?.away && (
        <View style={[styles.away, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}>
          <AppText style={{ fontWeight: '600', fontSize: 13 }}>{t.awayNow}</AppText>
          {availability.awayMessage ? (
            <AppText variant="muted" style={{ fontSize: 12 }}>
              {availability.awayMessage}
            </AppText>
          ) : null}
          {availability.awayUntil ? (
            <AppText variant="muted" style={{ fontSize: 12 }}>
              {t.backAt(formatDate(availability.awayUntil))}
            </AppText>
          ) : null}
        </View>
      )}

      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.thread}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {denied ? (
          <Card>
            <AppText variant="muted">
              {denied === 'BLOCKED'
                ? t.blockedNotice
                : denied === 'UNVERIFIED'
                  ? t.verifyFirst
                  : t.onlyCustomers}
            </AppText>
          </Card>
        ) : messages === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : messages.length === 0 ? (
          <Card>
            <AppText variant="muted">{t.empty}</AppText>
          </Card>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={{ gap: 2, alignItems: message.fromStaff ? 'flex-start' : 'flex-end' }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.messageActions}
                // Sin ratón no hay "pasar por encima": las acciones salen al
                // mantener pulsado, que es lo que todo el mundo intenta.
                onLongPress={() => {
                  void haptics.trigger('selection')
                  setActing(message)
                }}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: message.fromStaff ? colors.muted : colors.card,
                    borderColor: message.fromStaff ? colors.border : colors.primary,
                  },
                ]}
              >
                {message.replyTo ? (
                  <View style={[styles.quote, { borderLeftColor: colors.primary }]}>
                    <AppText variant="muted" style={{ fontSize: 11, fontWeight: '600' }}>
                      {message.replyTo.fromStaff ? t.store : t.you}
                    </AppText>
                    <AppText variant="muted" style={{ fontSize: 11 }} numberOfLines={2}>
                      {message.replyTo.kind === 'IMAGE' ? t.imageAlt : message.replyTo.body}
                    </AppText>
                  </View>
                ) : null}

                {message.kind === 'IMAGE' && message.imageUrl ? (
                  <Image
                    source={{ uri: message.imageUrl }}
                    accessibilityLabel={message.body || t.imageAlt}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <AppText style={{ lineHeight: 21 }}>{message.body}</AppText>
                )}
              </Pressable>

              {message.reactions.length > 0 && (
                <View style={styles.reactions}>
                  {message.reactions.map((reaction) => {
                    const Icon = iconOf(reaction.kind)
                    return (
                      <View
                        key={reaction.id}
                        style={[
                          styles.reactionChip,
                          { backgroundColor: colors.muted, borderColor: colors.border },
                        ]}
                      >
                        <Icon size={12} color={colors.mutedForeground} />
                      </View>
                    )
                  })}
                </View>
              )}

              <View style={styles.meta}>
                <AppText variant="muted" style={{ fontSize: 11 }}>
                  {message.fromStaff ? t.store : t.you} · {formatDate(message.createdAt)}
                </AppText>
                {/* El acuse solo tiene sentido en lo que uno manda. */}
                {!message.fromStaff && (
                  <MessageTicks state={tickFor(message.createdAt, staffReadAt)} />
                )}
              </View>
            </View>
          ))
        )}

        {typing && (
          <View
            style={[
              styles.bubble,
              { backgroundColor: colors.muted, borderColor: colors.border, alignSelf: 'flex-start' },
            ]}
          >
            <TypingDots />
          </View>
        )}
      </ScrollView>

      {replyTo && !denied ? (
        <View style={[styles.replyBar, { backgroundColor: colors.muted, borderTopColor: colors.border }]}>
          <CornerUpLeft size={14} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 12, fontWeight: '600' }}>
              {t.replyingTo} {replyTo.fromStaff ? t.store : t.you}
            </AppText>
            <AppText variant="muted" style={{ fontSize: 12 }} numberOfLines={1}>
              {replyTo.kind === 'IMAGE' ? t.imageAlt : replyTo.body}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.cancelReply}
            hitSlop={8}
            onPress={() => setReplyTo(null)}
          >
            <X size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.composer,
          { borderTopColor: colors.border, paddingBottom: insets.bottom + spacing.sm },
          denied ? { display: 'none' } : null,
        ]}
      >
        <TextInput
          value={body}
          onChangeText={(value) => {
            setBody(value)
            notifyTyping()
          }}
          placeholder={t.placeholder}
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel={t.placeholder}
          maxLength={MAX_BODY}
          multiline
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.send}
          disabled={sending || !body.trim()}
          onPress={() => void send()}
          style={({ pressed }) => [
            styles.sendButton,
            { backgroundColor: colors.primary },
            (sending || !body.trim()) && { opacity: 0.4 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Send size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>
      <MessageSheet
        message={acting}
        onClose={() => setActing(null)}
        onReact={react}
        onReply={() => {
          setReplyTo(acting)
          setActing(null)
        }}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  away: {
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thread: { padding: spacing.lg, gap: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xs },
  quote: { borderLeftWidth: 2, paddingLeft: spacing.sm, marginBottom: spacing.xs, gap: 1 },
  reactions: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.xs },
  reactionChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bubble: {
    maxWidth: '86%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  image: { width: 200, height: 150, borderRadius: radius.md },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    textAlignVertical: 'top',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  sendButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
})
