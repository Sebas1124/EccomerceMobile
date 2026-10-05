import { Stack, useLocalSearchParams } from 'expo-router'
import { CheckCircle2, Send } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, notify } from '@/shared/feedback'
import { formatDate } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { ticketsApi, type Ticket, type TicketMessage } from '../api/tickets-api'
import { ticketsTexts as t } from '../texts'

/** El personal se distingue por su rol; el resto es el propio cliente. */
const isStaff = (message: TicketMessage) =>
  message.author?.role === 'ADMIN' || message.author?.role === 'SUPERADMIN'

export function TicketDetailScreen() {
  const { number } = useLocalSearchParams<{ number: string }>()
  const colors = useColors()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [missing, setMissing] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!number) return
    let alive = true
    ticketsApi
      .get(number)
      .then(({ ticket: loaded }) => {
        if (alive) setTicket(loaded)
      })
      .catch(() => alive && setMissing(true))
    return () => {
      alive = false
    }
  }, [number])

  if (missing) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t.title }} />
        <AppText variant="muted">{t.notFound}</AppText>
      </Screen>
    )
  }

  if (!ticket) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t.title }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    )
  }

  const closed = ticket.status === 'CLOSED'

  const send = async () => {
    if (!body.trim()) return
    setSending(true)
    try {
      const { ticket: updated } = await ticketsApi.reply(ticket.number, body.trim())
      setTicket(updated)
      setBody('')
      notify.success(t.replied)
    } catch (error) {
      notify.fromError(error)
    } finally {
      setSending(false)
    }
  }

  const close = () =>
    confirm({
      title: t.closeTitle,
      description: t.closeConfirm,
      tone: 'warning',
      confirmLabel: t.closeTicket,
      action: async () => {
        const { ticket: updated } = await ticketsApi.close(ticket.number)
        setTicket(updated)
        notify.success(t.closed)
      },
    })

  return (
    <Screen>
      <Stack.Screen options={{ title: ticket.number }} />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{ticket.subject}</AppText>
        <AppText variant="muted" style={{ fontSize: 13 }}>
          {t.statuses[ticket.status]} · {t.openedOn(formatDate(ticket.createdAt))}
          {ticket.order ? ` · ${t.aboutOrder(ticket.order.number)}` : ''}
        </AppText>
      </View>

      <View style={{ gap: spacing.md }}>
        {(ticket.messages ?? []).map((message) => {
          const staff = isStaff(message)
          return (
            <View
              key={message.id}
              style={[styles.bubbleRow, { alignItems: staff ? 'flex-start' : 'flex-end' }]}
            >
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: staff ? colors.muted : colors.card,
                    borderColor: staff ? colors.border : colors.primary,
                  },
                ]}
              >
                <AppText style={{ lineHeight: 21 }}>{message.body}</AppText>
              </View>
              <AppText variant="muted" style={{ fontSize: 11, paddingHorizontal: spacing.xs }}>
                {staff ? t.store : t.you} · {formatDate(message.createdAt)}
              </AppText>
            </View>
          )
        })}
      </View>

      {closed ? (
        <Card>
          <AppText variant="muted">{t.closedNotice}</AppText>
        </Card>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t.replyPlaceholder}
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            accessibilityLabel={t.reply}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card },
            ]}
          />
          <Button
            label={t.reply}
            icon={Send}
            loading={sending}
            disabled={!body.trim()}
            haptic="success"
            onPress={() => void send()}
          />
          <Button
            label={t.closeTicket}
            icon={CheckCircle2}
            variant="outline"
            onPress={() => void close()}
          />
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  bubbleRow: { gap: 2 },
  bubble: {
    maxWidth: '88%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    minHeight: 96,
    textAlignVertical: 'top',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 15,
  },
})
