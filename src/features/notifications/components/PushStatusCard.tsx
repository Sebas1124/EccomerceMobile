import { Bell, BellOff } from 'lucide-react-native'
import { View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Card } from '@/shared/components/Card'
import { spacing } from '@/shared/theme/tokens'
import { usePushStore } from '../store/push-store'
import { notificationsTexts as t } from '../texts'

/**
 * Estado de los avisos en este dispositivo.
 *
 * Existe porque un fallo silencioso aquí es el peor de todos: el panel dice
 * "enviado", el móvil no suena y nadie sabe por qué. Si no se puede recibir,
 * la app dice el motivo.
 */
export function PushStatusCard() {
  const colors = useColors()
  const status = usePushStore((s) => s.status)
  const blocker = usePushStore((s) => s.blocker)
  const error = usePushStore((s) => s.error)

  if (status === 'idle') return null

  const ok = status === 'registered'
  const detail =
    status === 'registered'
      ? t.statusRegistered
      : status === 'denied'
        ? t.statusDenied
        : status === 'error'
          ? (error ?? t.statusError)
          : blocker
            ? t.blockers[blocker]
            : t.statusError

  const Icon = ok ? Bell : BellOff

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Icon size={18} color={ok ? colors.success : colors.mutedForeground} />
        <AppText style={{ fontWeight: '600' }}>{t.statusTitle}</AppText>
      </View>
      <AppText variant="muted" style={{ fontSize: 13, lineHeight: 19 }}>
        {detail}
      </AppText>
    </Card>
  )
}
