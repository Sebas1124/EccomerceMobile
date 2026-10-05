import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { RichText } from '@/shared/components/RichText'
import { Screen } from '@/shared/components/Screen'
import { formatDate } from '@/shared/lib/format'
import { spacing } from '@/shared/theme/tokens'
import { legalApi, type LegalDocument } from '../api/legal-api'
import { legalTexts as t } from '../texts'

export function LegalDocumentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const colors = useColors()
  const [document, setDocument] = useState<LegalDocument | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!slug) return
    let alive = true
    legalApi
      .get(slug)
      .then(({ document: loaded }) => {
        if (alive) setDocument(loaded)
      })
      // Un documento que no existe no es un error que avisar: se enseña y ya.
      .catch(() => alive && setMissing(true))
    return () => {
      alive = false
    }
  }, [slug])

  if (missing) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t.title }} />
        <AppText variant="muted">{t.notFound}</AppText>
      </Screen>
    )
  }

  if (!document) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t.title }} />
        <ActivityIndicator color={colors.primary} />
      </Screen>
    )
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: document.title }} />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{document.title}</AppText>
        <AppText variant="muted" style={{ fontSize: 13 }}>
          {t.version(document.version)} · {t.updatedOn(formatDate(document.updatedAt))}
        </AppText>
      </View>

      <RichText html={document.content} />
    </Screen>
  )
}
