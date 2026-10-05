import { TriangleAlert } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuthStore } from '@/features/auth'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, notify } from '@/shared/feedback'
import { AppForm, yup, type FieldConfig } from '@/shared/forms'
import { formatDate } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { accountApi } from '../api/account-api'
import { accountTexts as t } from '../texts'
import type { AccountOverview, ProfileValues } from '../types'

const profileSchema: yup.ObjectSchema<ProfileValues> = yup.object({
  firstName: yup.string().trim().min(2).max(60).required(),
  lastName: yup.string().trim().min(2).max(80).required(),
  phone: yup.string().trim().max(30).defined(),
})

const profileFields: FieldConfig<ProfileValues>[] = [
  { kind: 'text', name: 'firstName', label: t.fieldFirstName, autoComplete: 'given-name' },
  { kind: 'text', name: 'lastName', label: t.fieldLastName, autoComplete: 'family-name' },
  { kind: 'text', name: 'phone', label: t.fieldPhone, keyboardType: 'phone-pad' },
]

const reasonSchema: yup.ObjectSchema<{ reason: string }> = yup.object({
  reason: yup.string().trim().max(300).defined(),
})

const codeSchema: yup.ObjectSchema<{ code: string }> = yup.object({
  code: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, 'Son 6 dígitos')
    .required(),
})

export function ProfileScreen() {
  const colors = useColors()
  const setUser = useAuthStore((state) => state.setUser)
  const [overview, setOverview] = useState<AccountOverview | null>(null)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    accountApi
      .overview()
      .then((data) => {
        if (alive) setOverview(data)
      })
      .catch((error: unknown) => notify.fromError(error, t.loadError))
    return () => {
      alive = false
    }
  }, [version])

  const reload = () => setVersion((value) => value + 1)

  const cancelDeletion = async () => {
    setBusy(true)
    try {
      await accountApi.cancelDeletion()
      notify.success(t.deletionCancelled)
      reload()
    } catch (error) {
      notify.fromError(error)
    } finally {
      setBusy(false)
    }
  }

  if (!overview) {
    return (
      <Screen centered>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    )
  }

  const deletion = overview.deletionRequest
  const pendingDeletion = deletion?.status === 'PENDING'
  const scheduledDeletion = deletion?.status === 'CONFIRMED'

  return (
    <Screen>
      <Card title={t.profileTitle} description={t.profileHint}>
        <AppForm<ProfileValues>
          schema={profileSchema}
          defaultValues={{
            firstName: overview.user.firstName,
            lastName: overview.user.lastName,
            phone: overview.user.phone ?? '',
          }}
          fields={profileFields}
          submitLabel={t.saveProfile}
          onSubmit={async (values) => {
            const { user } = await accountApi.updateProfile({
              firstName: values.firstName,
              lastName: values.lastName,
              phone: values.phone || null,
            })
            setUser(user)
            notify.success(t.profileSaved)
          }}
        />
      </Card>

      {overview.pendingEmail && (
        <Card>
          <AppText>{t.pendingEmail(overview.pendingEmail.newEmail)}</AppText>
          <AppText variant="muted">{t.emailOnWeb}</AppText>
        </Card>
      )}

      <Card style={{ borderColor: colors.destructive }}>
        <View style={styles.dangerHeader}>
          <TriangleAlert color={colors.destructive} size={20} />
          <AppText variant="subtitle">{t.dangerTitle}</AppText>
        </View>
        <AppText variant="muted">{t.dangerHint}</AppText>

        {scheduledDeletion ? (
          <>
            <View style={[styles.alert, { borderColor: colors.destructive }]}>
              <AppText>{t.deletionScheduled(formatDate(deletion.purgeAt))}</AppText>
            </View>
            <Button
              label={t.cancelDeletion}
              variant="outline"
              disabled={busy}
              onPress={() => void cancelDeletion()}
            />
          </>
        ) : pendingDeletion ? (
          <>
            <AppText variant="muted">{t.deletionPending}</AppText>
            <AppForm<{ code: string }>
              schema={codeSchema}
              defaultValues={{ code: '' }}
              fields={[{ kind: 'otp', name: 'code', label: t.fieldCode }]}
              submitLabel={t.confirmDeletion}
              onSubmit={async ({ code }) => {
                const { request } = await accountApi.confirmDeletion(code)
                notify.warning(t.deletionScheduled(formatDate(request.purgeAt)))
                reload()
              }}
            />
            <Button
              label={t.cancelDeletion}
              variant="ghost"
              disabled={busy}
              onPress={() => void cancelDeletion()}
            />
          </>
        ) : (
          <AppForm<{ reason: string }>
            schema={reasonSchema}
            defaultValues={{ reason: '' }}
            fields={[{ kind: 'text', name: 'reason', label: t.fieldReason }]}
            submitLabel={t.requestDeletion}
            onSubmit={async ({ reason }) => {
              await confirm({
                title: t.deletionConfirmTitle,
                description: t.deletionConfirmBody,
                tone: 'danger',
                confirmLabel: t.requestDeletion,
                action: async () => {
                  await accountApi.requestDeletion(reason || null)
                  notify.success(t.deletionCodeSent)
                  reload()
                },
              })
            }}
          />
        )}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alert: { padding: spacing.md, borderWidth: 1, borderRadius: radius.lg },
})
