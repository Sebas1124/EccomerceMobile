import { Link, router } from 'expo-router'
import { View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Screen } from '@/shared/components/Screen'
import { notify } from '@/shared/feedback'
import { AppForm, rules, yup, type FieldConfig } from '@/shared/forms'
import { spacing } from '@/shared/theme/tokens'
import { authApi } from '../api/auth-api'
import { authTexts as t } from '../texts'
import type { RegisterValues } from '../types'

const schema: yup.ObjectSchema<RegisterValues> = yup.object({
  firstName: rules.name(),
  lastName: rules.name(),
  email: rules.email(),
  password: rules.password(),
  confirmPassword: rules.confirm('password'),
  acceptTerms: rules.accept(t.register.acceptTermsRequired),
})

const fields: FieldConfig<RegisterValues>[] = [
  {
    kind: 'text',
    name: 'firstName',
    label: t.register.firstName,
    autoComplete: 'given-name',
    autoCapitalize: 'words',
  },
  {
    kind: 'text',
    name: 'lastName',
    label: t.register.lastName,
    autoComplete: 'family-name',
    autoCapitalize: 'words',
  },
  {
    kind: 'text',
    name: 'email',
    label: t.register.email,
    keyboardType: 'email-address',
    autoComplete: 'email',
    autoCapitalize: 'none',
  },
  {
    kind: 'password',
    name: 'password',
    label: t.register.password,
    description: t.register.passwordHelp,
    autoComplete: 'new-password',
  },
  {
    kind: 'password',
    name: 'confirmPassword',
    label: t.register.confirmPassword,
    autoComplete: 'new-password',
  },
  { kind: 'checkbox', name: 'acceptTerms', label: t.register.acceptTerms },
]

export function RegisterScreen() {
  const colors = useColors()
  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.register.title}</AppText>
        <AppText variant="muted">{t.register.subtitle}</AppText>
      </View>
      <AppForm
        schema={schema}
        defaultValues={{
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          acceptTerms: false,
        }}
        fields={fields}
        submitLabel={t.register.submit}
        onSubmit={async (values) => {
          await authApi.register(values)
          const email = values.email.trim().toLowerCase()
          notify.info(t.register.codeSent, { description: email })
          router.replace({ pathname: '/verify-email', params: { email } })
        }}
        footer={
          <Link href="/login" style={{ alignSelf: 'center' }}>
            <AppText variant="muted">
              {t.register.haveAccount} <AppText style={{ color: colors.primary }}>{t.register.login}</AppText>
            </AppText>
          </Link>
        }
      />
    </Screen>
  )
}
