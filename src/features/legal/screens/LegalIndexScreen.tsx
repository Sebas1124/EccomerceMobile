import { Stack, router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { notify } from '@/shared/feedback'
import { formatDate } from '@/shared/lib/format'
import { spacing } from '@/shared/theme/tokens'
import { legalApi, type LegalSummary } from '../api/legal-api'
import { legalTexts as t } from '../texts'

export function LegalIndexScreen() {
  const colors = useColors()
  const [items, setItems] = useState<LegalSummary[] | null>(null)

  useEffect(() => {
    let alive = true
    legalApi
      .list()
      .then(({ items: loaded }) => {
        if (alive) setItems(loaded)
      })
      .catch((error: unknown) => {
        if (!alive) return
        setItems([])
        notify.fromError(error, t.loadError)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.title}</AppText>
        <AppText variant="muted">{t.subtitle}</AppText>
      </View>

      {items === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <Card>
          <AppText variant="muted">{t.empty}</AppText>
        </Card>
      ) : (
        <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
          {items.map((document, index) => (
            <Pressable
              key={document.slug}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/legal/[slug]', params: { slug: document.slug } })}
              style={({ pressed }) => [
                styles.row,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <AppText style={{ fontWeight: '500' }}>{document.title}</AppText>
                {document.summary && (
                  <AppText variant="muted" style={{ fontSize: 13 }}>
                    {document.summary}
                  </AppText>
                )}
                <AppText variant="muted" style={{ fontSize: 12 }}>
                  {t.version(document.version)} · {t.updatedOn(formatDate(document.updatedAt))}
                </AppText>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </Card>
      )}
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
