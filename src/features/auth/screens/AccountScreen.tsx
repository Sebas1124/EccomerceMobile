import { router } from 'expo-router'
import { LogIn, LogOut, Smartphone, Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, Switch, View } from 'react-native'
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { PushStatusCard } from '@/features/notifications'
import { NavList, NAV_GROUPS } from '@/shared/navigation/NavList'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, haptics, notify, useHapticsStore } from '@/shared/feedback'
import { AppForm, rules, yup, type FieldConfig } from '@/shared/forms'
import { radius, spacing } from '@/shared/theme/tokens'
import { FeatureGate, FeatureKey } from '@/features/app-config'
import { authApi } from '../api/auth-api'
import { TwoFactorCard } from '../components/TwoFactorCard'
import { useAuthStore } from '../store/auth-store'
import { authTexts as t } from '../texts'
import type { Device } from '../types'

interface ChangePasswordValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const schema: yup.ObjectSchema<ChangePasswordValues> = yup.object({
  currentPassword: rules.currentPassword(),
  newPassword: rules.password(),
  confirmPassword: rules.confirm('newPassword'),
})

const fields: FieldConfig<ChangePasswordValues>[] = [
  {
    kind: 'password',
    name: 'currentPassword',
    label: t.security.currentPassword,
    autoComplete: 'current-password',
  },
  { kind: 'password', name: 'newPassword', label: t.security.newPassword, autoComplete: 'new-password' },
  {
    kind: 'password',
    name: 'confirmPassword',
    label: t.security.confirmPassword,
    autoComplete: 'new-password',
  },
]

function DevicesCard() {
  const colors = useColors()
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    authApi
      .devices()
      .then(({ items }) => active && setDevices(items))
      .catch((error: unknown) => notify.fromError(error, t.security.loadError))
    return () => {
      active = false
    }
  }, [version])

  const revoke = (device: Device) =>
    confirm({
      title: t.security.revokeTitle(device.name),
      description: t.security.revokeConfirm,
      tone: 'danger',
      confirmLabel: t.security.revoke,
      action: async () => {
        await authApi.revokeDevice(device.id)
        notify.success(t.security.revoked(device.name))
        setVersion((v) => v + 1)
      },
    })

  return (
    <Card title={t.security.devices} description={t.security.devicesHelp}>
      {devices?.map((device) => (
        <Animated.View
          key={device.id}
          entering={FadeInDown}
          exiting={FadeOutLeft}
          layout={LinearTransition}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
          }}
        >
          <Smartphone color={colors.mutedForeground} size={20} />
          <View style={{ flex: 1 }}>
            <AppText variant="label">{device.name}</AppText>
            <AppText variant="muted">{device.current ? t.security.current : device.platform}</AppText>
          </View>
          {!device.current && (
            <Pressable
              onPress={() => void revoke(device)}
              accessibilityRole="button"
              accessibilityLabel={`${t.security.revoke} ${device.name}`}
              hitSlop={10}
            >
              <Trash2 color={colors.destructive} size={20} />
            </Pressable>
          )}
        </Animated.View>
      ))}
    </Card>
  )
}

/** Preferencias del dispositivo (no requieren sesión). */
function PreferencesCard() {
  const colors = useColors()
  const enabled = useHapticsStore((s) => s.enabled)
  const setEnabled = useHapticsStore((s) => s.setEnabled)
  const intensity = useHapticsStore((s) => s.intensity)
  const setIntensity = useHapticsStore((s) => s.setIntensity)
  return (
    <Card title={t.preferences.title}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <AppText variant="label">{t.preferences.haptics}</AppText>
          <AppText variant="muted">{t.preferences.hapticsHelp}</AppText>
        </View>
        <Switch
          value={enabled}
          onValueChange={(value) => {
            setEnabled(value)
            if (value) void haptics.trigger('toggle')
          }}
          trackColor={{ true: colors.primary, false: colors.muted }}
          accessibilityLabel={t.preferences.haptics}
        />
      </View>

      {enabled && (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label">{t.preferences.intensity}</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {(['subtle', 'standard', 'strong'] as const).map((level) => {
              const active = intensity === level
              return (
                <Pressable
                  key={level}
                  onPress={() => {
                    setIntensity(level)
                    // Se siente al instante el nivel elegido.
                    void haptics.trigger('tap')
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t.preferences.intensityLevels[level]}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? `${colors.primary}22` : 'transparent',
                  }}
                >
                  <AppText variant="muted" style={active ? { color: colors.primary } : undefined}>
                    {t.preferences.intensityLevels[level]}
                  </AppText>
                </Pressable>
              )
            })}
          </View>
          <Button
            label={t.preferences.testHaptics}
            variant="outline"
            haptic="cart.add"
            onPress={() => notify.success(t.preferences.testHapticsDone)}
          />
          <AppText variant="muted">{t.preferences.systemHapticsHelp}</AppText>
        </View>
      )}
    </Card>
  )
}

/** Tab Cuenta: acceso para invitados; datos, seguridad y dispositivos para usuarios con sesión. */
export function AccountScreen() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  if (status !== 'authenticated' || !user) {
    return (
      <Screen centered>
        <AppText variant="title">{t.menu.account}</AppText>
        <AppText variant="muted">{t.login.subtitle}</AppText>
        <Button label={t.menu.login} icon={LogIn} onPress={() => router.push('/login')} />
        <Button label={t.login.register} variant="outline" onPress={() => router.push('/register')} />
        <PreferencesCard />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{`${user.firstName} ${user.lastName}`}</AppText>
        <AppText variant="muted">{user.email}</AppText>
      </View>

      <NavList group={NAV_GROUPS.account} />
      <NavList group={NAV_GROUPS.info} />

      <PushStatusCard />

      <Card title={t.security.changePassword} description={t.security.changePasswordHelp}>
        <AppForm
          schema={schema}
          defaultValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
          fields={fields}
          submitLabel={t.security.save}
          onSubmit={async (values, form) => {
            await authApi.changePassword(values.currentPassword, values.newPassword)
            notify.success(t.security.passwordChanged, { description: t.security.passwordChangedHelp })
            form.reset()
          }}
        />
      </Card>

      <FeatureGate feature={FeatureKey.TwoFactor}>
        <TwoFactorCard />
      </FeatureGate>

      <PreferencesCard />

      <DevicesCard />

      <Button
        label={t.menu.logout}
        variant="outline"
        icon={LogOut}
        onPress={() =>
          void confirm({
            title: t.menu.logoutTitle,
            description: t.menu.logoutConfirm,
            tone: 'warning',
            icon: LogOut,
            confirmLabel: t.menu.logout,
            action: async () => {
              await logout()
              notify.info(t.menu.loggedOut)
            },
          })
        }
      />
    </Screen>
  )
}
