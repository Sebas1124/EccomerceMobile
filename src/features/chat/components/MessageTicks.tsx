import { Check, CheckCheck } from 'lucide-react-native'
import { useColors } from '@/features/theme'
import { chatTexts as t } from '../texts'
import type { TickState } from '../lib/ticks'

/** Azul del "leído", el mismo en claro y en oscuro. */
const READ_COLOR = '#0ea5e9'

/**
 * Acuse de un mensaje propio.
 *
 * - Un check: saliendo, todavía sin confirmar por el servidor.
 * - Doble check gris: el servidor lo tiene, así que el otro lado lo recibe.
 * - Doble check azul: el otro lado ya lo ha leído.
 */
export function MessageTicks({ state }: { state: TickState }) {
  const colors = useColors()
  const label =
    state === 'read' ? t.tickRead : state === 'delivered' ? t.tickDelivered : t.tickSending

  if (state === 'sending') {
    return <Check size={13} color={colors.mutedForeground} accessibilityLabel={label} />
  }

  return (
    <CheckCheck
      size={13}
      color={state === 'read' ? READ_COLOR : colors.mutedForeground}
      accessibilityLabel={label}
    />
  )
}
