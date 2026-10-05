import { ShoppingCart } from 'lucide-react-native'
import { useState } from 'react'
import { Button } from '@/shared/components/Button'
import { notify } from '@/shared/feedback'
import { useCartStore } from '../store/cart-store'
import { cartTexts as t } from '../texts'
import type { GuestLine } from '../types'

/** Añade una línea al carrito, con o sin sesión. */
export function AddToCartButton({
  line,
  disabled,
  fullWidth = true,
  onAdded,
}: {
  line: GuestLine
  disabled?: boolean
  fullWidth?: boolean
  /** Se llama solo si se ha añadido de verdad. */
  onAdded?: () => void
}) {
  const add = useCartStore((state) => state.add)
  const [busy, setBusy] = useState(false)

  const onPress = async () => {
    setBusy(true)
    try {
      await add(line)
      notify.success(line.qty > 1 ? t.addedUnits(line.qty) : t.added)
      onAdded?.()
    } catch (error) {
      notify.fromError(error, t.addError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      label={t.addToCart}
      icon={ShoppingCart}
      loading={busy}
      disabled={disabled || busy}
      fullWidth={fullWidth}
      haptic="success"
      onPress={() => void onPress()}
    />
  )
}
