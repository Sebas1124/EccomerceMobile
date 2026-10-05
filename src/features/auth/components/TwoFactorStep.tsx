import { useState } from 'react'
import { View } from 'react-native'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Screen } from '@/shared/components/Screen'
import { AppForm, rules, yup, type FieldConfig } from '@/shared/forms'
import { spacing } from '@/shared/theme/tokens'
import { useAuthStore } from '../store/auth-store'
import { authTexts as t } from '../texts'
import type { User } from '../types'

const appCodeSchema: yup.ObjectSchema<{ code: string }> = yup.object({ code: rules.otp() })
const appCodeFields: FieldConfig<{ code: string }>[] = [
  { kind: 'otp', name: 'code', label: t.loginTwoFactor.code },
]

const recoverySchema: yup.ObjectSchema<{ code: string }> = yup.object({
  code: yup
    .string()
    .trim()
    .uppercase()
    .matches(/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/, t.loginTwoFactor.recoveryHelp)
    .required(),
})
const recoveryFields: FieldConfig<{ code: string }>[] = [
  {
    kind: 'text',
    name: 'code',
    label: t.loginTwoFactor.recoveryLabel,
    description: t.loginTwoFactor.recoveryHelp,
    autoCapitalize: 'characters',
    placeholder: 'XXXX-XXXX',
  },
]

/** Segundo paso del login: código de la app autenticadora o de recuperación. */
export function TwoFactorStep({
  challengeId,
  onDone,
  onCancel,
}: {
  challengeId: string
  onDone: (user: User) => void
  onCancel: () => void
}) {
  const verifyTwoFactor = useAuthStore((s) => s.verifyTwoFactor)
  const [useRecovery, setUseRecovery] = useState(false)

  return (
    <Screen centered>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.loginTwoFactor.title}</AppText>
        <AppText variant="muted">{t.loginTwoFactor.subtitle}</AppText>
      </View>
      <AppForm
        key={useRecovery ? 'recovery' : 'app'}
        schema={useRecovery ? recoverySchema : appCodeSchema}
        defaultValues={{ code: '' }}
        fields={useRecovery ? recoveryFields : appCodeFields}
        submitLabel={t.loginTwoFactor.submit}
        onSubmit={async ({ code }) => onDone(await verifyTwoFactor(challengeId, code))}
        footer={
          <View style={{ gap: spacing.sm }}>
            <Button
              label={useRecovery ? t.loginTwoFactor.useApp : t.loginTwoFactor.useRecovery}
              variant="ghost"
              onPress={() => setUseRecovery((value) => !value)}
            />
            <Button label={t.loginTwoFactor.back} variant="ghost" onPress={onCancel} />
          </View>
        }
      />
    </Screen>
  )
}
