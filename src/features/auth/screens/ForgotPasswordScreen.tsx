import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated'
import { AppText } from '@/shared/components/AppText'
import { Screen } from '@/shared/components/Screen'
import { notify } from '@/shared/feedback'
import { AppForm, rules, yup, type FieldConfig } from '@/shared/forms'
import { spacing } from '@/shared/theme/tokens'
import { authApi } from '../api/auth-api'
import { authTexts as t } from '../texts'

type Step =
  | { name: 'email' }
  | { name: 'code'; email: string }
  | { name: 'password'; email: string; resetToken: string }

const emailSchema: yup.ObjectSchema<{ email: string }> = yup.object({ email: rules.email() })
const codeSchema: yup.ObjectSchema<{ code: string }> = yup.object({ code: rules.otp() })
const passwordSchema: yup.ObjectSchema<{ password: string; confirmPassword: string }> = yup.object({
  password: rules.password(),
  confirmPassword: rules.confirm('password'),
})

const emailFields: FieldConfig<{ email: string }>[] = [
  {
    kind: 'text',
    name: 'email',
    label: t.forgot.email,
    keyboardType: 'email-address',
    autoComplete: 'email',
    autoCapitalize: 'none',
  },
]
const codeFields: FieldConfig<{ code: string }>[] = [{ kind: 'otp', name: 'code', label: t.forgot.code }]
const passwordFields: FieldConfig<{ password: string; confirmPassword: string }>[] = [
  { kind: 'password', name: 'password', label: t.forgot.password, autoComplete: 'new-password' },
  {
    kind: 'password',
    name: 'confirmPassword',
    label: t.forgot.confirmPassword,
    autoComplete: 'new-password',
  },
]

/** Recuperación en 3 pasos: email → código OTP → nueva contraseña. */
export function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>({ name: 'email' })
  const description =
    step.name === 'email'
      ? t.forgot.emailStep
      : step.name === 'code'
        ? t.forgot.codeStep(step.email)
        : t.forgot.passwordStep

  return (
    <Screen centered>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.forgot.title}</AppText>
        <AppText variant="muted">{description}</AppText>
      </View>
      <Animated.View
        key={step.name}
        entering={SlideInRight.duration(250)}
        exiting={SlideOutLeft.duration(200)}
      >
        {step.name === 'email' && (
          <AppForm
            schema={emailSchema}
            defaultValues={{ email: '' }}
            fields={emailFields}
            submitLabel={t.forgot.sendCode}
            onSubmit={async ({ email }) => {
              await authApi.forgotPassword(email)
              setStep({ name: 'code', email })
            }}
          />
        )}
        {step.name === 'code' && (
          <AppForm
            schema={codeSchema}
            defaultValues={{ code: '' }}
            fields={codeFields}
            submitLabel={t.forgot.verifyCode}
            onSubmit={async ({ code }) => {
              const { resetToken } = await authApi.verifyResetCode(step.email, code)
              setStep({ name: 'password', email: step.email, resetToken })
            }}
          />
        )}
        {step.name === 'password' && (
          <AppForm
            schema={passwordSchema}
            defaultValues={{ password: '', confirmPassword: '' }}
            fields={passwordFields}
            submitLabel={t.forgot.save}
            onSubmit={async ({ password }) => {
              await authApi.resetPassword(step.resetToken, password)
              notify.success(t.forgot.success)
              router.replace({ pathname: '/login', params: { email: step.email } })
            }}
          />
        )}
      </Animated.View>
    </Screen>
  )
}
