import { Stack, router, useFocusEffect } from 'expo-router'
import { ChevronRight, Plus } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { notify } from '@/shared/feedback'
import { formatDate } from '@/shared/lib/format'
import { spacing } from '@/shared/theme/tokens'
import { ticketsApi, type Ticket } from '../api/tickets-api'
import { NewTicketDialog } from '../components/NewTicketDialog'
import { ticketsTexts as t } from '../texts'

/** Color del distintivo según en qué tejado está la pelota. */
function statusColor(status: Ticket['status'], colors: ReturnType<typeof useColors>) {
  if (status === 'CLOSED' || status === 'RESOLVED') return colors.mutedForeground
  if (status === 'WAITING_CUSTOMER') return colors.success
  return colors.primary
}

export function TicketsScreen() {
  const colors = useColors()
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    let alive = true
    ticketsApi
      .mine()
      .then(({ items }) => {
        if (alive) setTickets(items)
      })
      .catch((error: unknown) => {
        if (!alive) return
        setTickets([])
        notify.fromError(error, t.loadError)
      })
    return () => {
      alive = false
    }
  }, [])

  // Al volver del detalle la lista tiene que reflejar lo que haya cambiado.
  useFocusEffect(load)

  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.title}</AppText>
        <AppText variant="muted">{t.subtitle}</AppText>
      </View>

      <Button label={t.create} icon={Plus} onPress={() => setCreating(true)} />

      {tickets === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : tickets.length === 0 ? (
        <Card>
          <AppText variant="muted">{t.empty}</AppText>
        </Card>
      ) : (
        <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
          {tickets.map((ticket, index) => (
            <Pressable
              key={ticket.id}
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/soporte/[number]', params: { number: ticket.number } })
              }
              style={({ pressed }) => [
                styles.row,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <AppText style={{ fontWeight: '500' }} numberOfLines={1}>
                  {ticket.subject}
                </AppText>
                <AppText variant="muted" style={{ fontSize: 12 }}>
                  {ticket.number} · {t.openedOn(formatDate(ticket.createdAt))}
                </AppText>
                <AppText style={{ fontSize: 12, color: statusColor(ticket.status, colors) }}>
                  {t.statuses[ticket.status]}
                </AppText>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </Card>
      )}

      <NewTicketDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          notify.success(t.created)
          load()
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
})
