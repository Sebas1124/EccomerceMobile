import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Screen } from '@/shared/components/Screen'
import { notify } from '@/shared/feedback'
import { AppForm, rules, yup, type FieldConfig } from '@/shared/forms'
import { spacing } from '@/shared/theme/tokens'
import { authApi } from '../api/auth-api'
import { authTexts as t } from '../texts'

const schema: yup.ObjectSchema<{ code: string }> = yup.object({ code: rules.otp() })
const fields: FieldConfig<{ code: string }>[] = [{ kind: 'otp', name: 'code', label: t.verify.code }]

function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    if (remaining <= 0) return
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])
  return { remaining, active: remaining > 0, start: () => setRemaining(seconds) }
}

export function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>()
  const cooldown = useCooldown(60)
  if (!email) return <Redirect href="/register" />

  return (
    <Screen centered>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.verify.title}</AppText>
        <AppText variant="muted">{t.verify.subtitle(email)}</AppText>
      </View>
      <AppForm
        schema={schema}
        defaultValues={{ code: '' }}
        fields={fields}
        submitLabel={t.verify.submit}
        onSubmit={async ({ code }) => {
          await authApi.verifyEmail(email, code)
          notify.success(t.verify.success)
          router.replace({ pathname: '/login', params: { email } })
        }}
        footer={
          <Button
            variant="ghost"
            label={cooldown.active ? t.verify.resendIn(cooldown.remaining) : t.verify.resend}
            disabled={cooldown.active}
            onPress={async () => {
              cooldown.start()
              await authApi.resendVerification(email).catch(() => undefined)
              notify.info(t.verify.resent)
            }}
          />
        }
      />
    </Screen>
  )
}
