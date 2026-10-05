import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import { ShieldCheck, ShieldOff } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { confirm, haptics, notify } from '@/shared/feedback'
import { AppForm, rules, yup, type FieldConfig } from '@/shared/forms'
import { radius, spacing } from '@/shared/theme/tokens'
import { authApi } from '../api/auth-api'
import { useAuthStore } from '../store/auth-store'
import { authTexts as t } from '../texts'

const codeSchema: yup.ObjectSchema<{ code: string }> = yup.object({ code: rules.otp() })
const codeFields: FieldConfig<{ code: string }>[] = [
  { kind: 'otp', name: 'code', label: t.twoFactor.codeLabel },
]

const disableSchema: yup.ObjectSchema<{ password: string; code: string }> = yup.object({
  password: rules.currentPassword(),
  code: yup.string().trim().min(6).max(12).required(),
})
const disableFields: FieldConfig<{ password: string; code: string }>[] = [
  { kind: 'password', name: 'password', label: t.twoFactor.passwordLabel, autoComplete: 'current-password' },
  { kind: 'text', name: 'code', label: t.twoFactor.codeOrRecovery, autoCapitalize: 'characters' },
]

type Mode = 'idle' | 'setup' | 'codes' | 'disable'

/** Alta y baja del doble factor desde la cuenta. Solo si la feature está activa. */
export function TwoFactorCard() {
  const colors = useColors()
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState<{ enabled: boolean; remainingRecoveryCodes: number } | null>(null)
  const [mode, setMode] = useState<Mode>('idle')
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null)
  const [codes, setCodes] = useState<string[]>([])

  useEffect(() => {
    let active = true
    authApi
      .twoFactorStatus()
      .then((value) => active && setStatus(value))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [user?.twoFactorEnabled])

  const refresh = async () => setStatus(await authApi.twoFactorStatus())

  const copy = async (value: string, message: string) => {
    await Clipboard.setStringAsync(value)
    void haptics.trigger('selection')
    notify.success(message)
  }

  if (!status) return null

  return (
    <Card title={t.twoFactor.title} description={t.twoFactor.help}>
      <AppText variant="muted">
        {status.enabled
          ? `${t.twoFactor.active} · ${t.twoFactor.remainingCodes(status.remainingRecoveryCodes)}`
          : t.twoFactor.inactive}
      </AppText>

      {mode === 'codes' && (
        <Animated.View entering={FadeIn} style={{ gap: spacing.sm }}>
          <AppText variant="label">{t.twoFactor.recoveryTitle}</AppText>
          <AppText variant="muted">{t.twoFactor.recoveryHelp}</AppText>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
            }}
          >
            {codes.map((code) => (
              <AppText key={code} style={{ width: '45%', fontFamily: 'monospace' }}>
                {code}
              </AppText>
            ))}
          </View>
          <Button
            label={t.twoFactor.copyCodes}
            variant="outline"
            onPress={() => void copy(codes.join('\n'), t.twoFactor.copied)}
          />
          <Button label={t.twoFactor.understood} onPress={() => setMode('idle')} />
        </Animated.View>
      )}

      {mode === 'setup' && setup && (
        <Animated.View entering={FadeIn} style={{ gap: spacing.md }}>
          <AppText variant="muted">{t.twoFactor.scan}</AppText>
          <Image
            source={{ uri: setup.qrDataUrl }}
            style={{
              width: 200,
              height: 200,
              alignSelf: 'center',
              borderRadius: radius.lg,
              backgroundColor: '#fff',
            }}
            contentFit="contain"
            accessibilityLabel={t.twoFactor.scan}
          />
          <AppText variant="label">{t.twoFactor.manualKey}</AppText>
          <AppText selectable style={{ fontFamily: 'monospace' }}>
            {setup.secret}
          </AppText>
          <Button
            label={t.twoFactor.copyKey}
            variant="outline"
            onPress={() => void copy(setup.secret, t.twoFactor.copied)}
          />
          <AppForm
            schema={codeSchema}
            defaultValues={{ code: '' }}
            fields={codeFields}
            submitLabel={t.twoFactor.confirm}
            onSubmit={async ({ code }) => {
              const { recoveryCodes } = await authApi.twoFactorEnable(code)
              setCodes(recoveryCodes)
              setSetup(null)
              setMode('codes')
              notify.success(t.twoFactor.enabled)
              await refresh()
            }}
            footer={<Button label={t.twoFactor.cancel} variant="ghost" onPress={() => setMode('idle')} />}
          />
        </Animated.View>
      )}

      {mode === 'disable' && (
        <Animated.View entering={FadeIn}>
          <AppForm
            schema={disableSchema}
            defaultValues={{ password: '', code: '' }}
            fields={disableFields}
            submitLabel={t.twoFactor.disable}
            onSubmit={async ({ password, code }) => {
              await authApi.twoFactorDisable(password, code)
              setMode('idle')
              notify.success(t.twoFactor.disabled)
              await refresh()
            }}
            footer={<Button label={t.twoFactor.cancel} variant="ghost" onPress={() => setMode('idle')} />}
          />
        </Animated.View>
      )}

      {mode === 'idle' &&
        (status.enabled ? (
          <Button
            label={t.twoFactor.disable}
            variant="destructive"
            icon={ShieldOff}
            onPress={() =>
              void confirm({
                title: t.twoFactor.disableTitle,
                description: t.twoFactor.disableConfirm,
                tone: 'warning',
                icon: ShieldOff,
                confirmLabel: t.twoFactor.disable,
              }).then((ok) => ok && setMode('disable'))
            }
          />
        ) : (
          <Button
            label={t.twoFactor.start}
            icon={ShieldCheck}
            onPress={async () => {
              try {
                setSetup(await authApi.twoFactorSetup())
                setMode('setup')
              } catch (error) {
                notify.fromError(error)
              }
            }}
          />
        ))}
    </Card>
  )
}
