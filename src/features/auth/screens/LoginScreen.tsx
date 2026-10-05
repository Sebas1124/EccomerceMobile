import { Link, router, useLocalSearchParams } from 'expo-router'
import { ShieldAlert } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Screen } from '@/shared/components/Screen'
import { cartTexts, useCartStore } from '@/features/cart'
import { notify } from '@/shared/feedback'
import { AppForm, rules, yup, type FieldConfig } from '@/shared/forms'
import { ApiError } from '@/shared/lib/api-client'
import { spacing } from '@/shared/theme/tokens'
import { TwoFactorStep } from '../components/TwoFactorStep'
import { useAuthStore } from '../store/auth-store'
import { authTexts as t } from '../texts'

interface Values {
  email: string
  password: string
}

const schema: yup.ObjectSchema<Values> = yup.object({
  email: rules.email(),
  password: rules.currentPassword(),
})

const fields: FieldConfig<Values>[] = [
  {
    kind: 'text',
    name: 'email',
    label: t.login.email,
    keyboardType: 'email-address',
    autoComplete: 'email',
    autoCapitalize: 'none',
  },
  { kind: 'password', name: 'password', label: t.login.password, autoComplete: 'current-password' },
]

/**
 * Sube al servidor lo que hubiera en el carrito del dispositivo. Si falla, el
 * carrito local se conserva: no se pierde nada, solo se fusiona más tarde.
 */
async function absorbGuestCart() {
  try {
    const merged = await useCartStore.getState().mergeGuest()
    if (merged > 0) notify.success(cartTexts.merged(merged))
  } catch {
    // La fusión se reintenta sola la próxima vez que se cargue el carrito.
  }
}

export function LoginScreen() {
  const login = useAuthStore((s) => s.login)
  const endReason = useAuthStore((s) => s.endReason)
  const clearEndReason = useAuthStore((s) => s.clearEndReason)
  const { email } = useLocalSearchParams<{ email?: string }>()
  const colors = useColors()
  const [challengeId, setChallengeId] = useState<string | null>(null)

  useEffect(() => () => clearEndReason(), [clearEndReason])

  // Segundo paso cuando la cuenta tiene doble factor.
  if (challengeId) {
    return (
      <TwoFactorStep
        challengeId={challengeId}
        onDone={(user) => {
          notify.success(t.login.welcome(user.firstName))
          void absorbGuestCart()
          router.replace('/account')
        }}
        onCancel={() => setChallengeId(null)}
      />
    )
  }

  return (
    <Screen centered>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.login.title}</AppText>
        <AppText variant="muted">{t.login.subtitle}</AppText>
      </View>
      {endReason && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <ShieldAlert color={colors.warning} size={18} />
          <AppText variant="muted" style={{ flex: 1 }}>
            {t.login.ended[endReason]}
          </AppText>
        </View>
      )}
      <AppForm
        schema={schema}
        defaultValues={{ email: email ?? '', password: '' }}
        fields={fields}
        submitLabel={t.login.submit}
        onSubmit={async (values) => {
          try {
            const result = await login(values.email, values.password)
            if (result.requires2fa) {
              setChallengeId(result.challengeId)
              return
            }
            notify.success(t.login.welcome(result.user.firstName))
            void absorbGuestCart()
            router.replace('/account')
          } catch (error) {
            if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
              router.push({ pathname: '/verify-email', params: { email: values.email } })
              return
            }
            throw error
          }
        }}
        footer={
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <Link href="/forgot-password">
              <AppText style={{ color: colors.primary }}>{t.login.forgot}</AppText>
            </Link>
            <Link href="/register">
              <AppText variant="muted">
                {t.login.noAccount} <AppText style={{ color: colors.primary }}>{t.login.register}</AppText>
              </AppText>
            </Link>
          </View>
        }
      />
    </Screen>
  )
}
