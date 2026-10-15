import { StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import type { AppliedPromotion } from '../types'

/**
 * Precio de un artículo. Si una promoción lo rebaja, se ve el precio nuevo, el
 * anterior tachado y el nombre de la promoción.
 */
export function PriceTag({
  priceCents,
  finalPriceCents,
  promotion,
  compareAtCents,
  prefix,
  toPriceCents,
  size = 'md',
}: {
  priceCents: number
  /** Si no llega, es el de catálogo. */
  finalPriceCents?: number
  promotion?: AppliedPromotion | null
  /** Precio anterior del propio producto, al margen de las promociones. */
  compareAtCents?: number | null
  /** Se ignora si hay rango. */
  prefix?: string
  /**
   * Extremo caro cuando el producto tiene variantes de precios distintos.
   *
   * Un producto de 20 € a 100 € anunciado "desde 20 €" promete un precio que
   * casi nadie va a pagar. Con rango se ve lo que hay.
   */
  toPriceCents?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const colors = useColors()
  const final = finalPriceCents ?? priceCents
  const range = toPriceCents !== undefined && toPriceCents > final
  const discounted = final < priceCents
  const struck = discounted ? priceCents : (compareAtCents ?? null)
  const showStruck = struck !== null && struck > final

  const fontSize = { sm: 14, md: 17, lg: 26 }[size]
  const oldSize = { sm: 12, md: 14, lg: 17 }[size]

  return (
    // En tamaño pequeño no se deja envolver: en una tarjeta estrecha una
    // segunda línea rompería la altura fija de la rejilla.
    <View style={[styles.row, size === 'sm' && styles.rowTight]}>
      <AppText
        numberOfLines={1}
        style={{
          fontSize,
          fontWeight: '700',
          color: discounted ? colors.primary : colors.foreground,
        }}
      >
        {range ? '' : prefix ? `${prefix} ` : ''}
        {formatPrice(final)}
        {range ? ` – ${formatPrice(toPriceCents)}` : ''}
      </AppText>

      {/* Con rango no se tacha nada: el precio anterior de una variante no
          dice nada del abanico entero. */}
      {!range && showStruck && (
        <AppText
          variant="muted"
          numberOfLines={1}
          style={{ fontSize: oldSize, textDecorationLine: 'line-through', flexShrink: 1 }}
        >
          {formatPrice(struck)}
        </AppText>
      )}

      {promotion && discounted && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <AppText style={{ fontSize: 11, fontWeight: '600', color: colors.primaryForeground }}>
            {promotion.name}
          </AppText>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  rowTight: { flexWrap: 'nowrap' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
})
