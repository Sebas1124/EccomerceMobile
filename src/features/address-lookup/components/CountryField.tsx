import { ChevronsUpDown, Globe } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { formatPrice } from '@/shared/lib/format'
import { radius, spacing } from '@/shared/theme/tokens'
import { countryName } from '../countries'
import { addressTexts as t } from '../texts'
import { PickerSheet } from './PickerSheet'

/**
 * Selector de país.
 *
 * Solo deja elegir los países que la tienda ha habilitado, y enseña el recargo
 * de cada uno **antes** de elegirlo: enterarse de que el envío sube cuatro
 * euros al final del checkout es la forma más rápida de perder el pedido.
 *
 * Con un solo país no es un selector, es un dato: se enseña sin poder tocarlo.
 */
export function CountryField({
  value,
  countries,
  surchargeOf,
  onChange,
}: {
  value: string
  /** Códigos ISO habilitados, con el país base primero. */
  countries: string[]
  surchargeOf: (code: string) => number
  onChange: (code: string) => void
}) {
  const colors = useColors()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const only = countries.length <= 1
  const surcharge = surchargeOf(value)

  const visible = countries.filter((code) => {
    const term = query.trim().toLowerCase()
    return !term || countryName(code).toLowerCase().includes(term)
  })

  return (
    <View style={styles.field}>
      <AppText variant="label">{t.country.label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.country.label}
        disabled={only}
        onPress={() => setOpen(true)}
        style={[
          styles.box,
          { borderColor: colors.input, backgroundColor: only ? colors.muted : colors.background },
        ]}
      >
        <Globe color={colors.mutedForeground} size={14} />
        <AppText style={{ flex: 1 }} numberOfLines={1}>
          {countryName(value)}
        </AppText>
        {!only && <ChevronsUpDown color={colors.mutedForeground} size={16} />}
      </Pressable>

      {only && <AppText variant="muted">{t.country.onlyBase}</AppText>}
      {!only && surcharge > 0 && (
        <AppText variant="muted">{t.country.surcharge(formatPrice(surcharge))}</AppText>
      )}

      <PickerSheet
        open={open}
        title={t.country.label}
        searchLabel={t.country.search}
        query={query}
        onQuery={setQuery}
        items={visible.map((code) => ({
          key: code,
          title: countryName(code),
          meta: surchargeOf(code) > 0 ? `+${formatPrice(surchargeOf(code))}` : undefined,
          selected: code === value,
        }))}
        onPick={(code) => {
          onChange(code)
          setOpen(false)
          setQuery('')
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
})
