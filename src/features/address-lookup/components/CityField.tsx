import { ChevronsUpDown, Lock } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { radius, spacing } from '@/shared/theme/tokens'
import { addressApi, type AddressAttribution, type CityHit } from '../api/address-lookup-api'
import { addressTexts as t } from '../texts'
import { Attribution } from './Attribution'
import { PickerSheet } from './PickerSheet'

/** Espera antes de buscar, para no lanzar una petición por tecla. */
const DEBOUNCE_MS = 300

/**
 * Selector de ciudad con buscador.
 *
 * La lista viene del servidor: siempre trae las capitales de provincia —que
 * funcionan sin callejero configurado— y el resto solo si la tienda lo tiene.
 *
 * Cuando la tienda solo reparte en su ciudad, el campo se enseña bloqueado con
 * el motivo: es más honesto que dejar elegir y rechazarlo al pagar.
 */
export function CityField<T extends FieldValues>({
  control,
  name,
  label,
  country,
  locked,
  lockedReason,
  onProvince,
}: {
  control: Control<T>
  name: FieldPath<T>
  label: string
  country: string
  locked?: boolean
  lockedReason?: string
  /** Cuando el callejero sabe la provincia de la ciudad elegida. */
  onProvince?: (province: string) => void
}) {
  const colors = useColors()
  const {
    field: { value, onChange },
    fieldState,
  } = useController({ control, name })
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<CityHit[]>([])
  const [credit, setCredit] = useState<AddressAttribution | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let alive = true

    const handle = setTimeout(() => {
      // Dentro del temporizador: encenderlo en el cuerpo del efecto encadena
      // renders, y además evita que parpadee en cada tecla.
      setLoading(true)
      addressApi
        .cities(query, country)
        .then(({ items: hits, attribution }) => {
          if (!alive) return
          setItems(hits)
          setCredit(attribution)
        })
        // Sin sugerencias se escribe a mano: no es motivo para un error.
        .catch(() => {
          if (alive) setItems([])
        })
        .finally(() => {
          if (alive) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      alive = false
      clearTimeout(handle)
    }
  }, [query, country, open])

  const current = String(value ?? '')

  if (locked) {
    return (
      <View style={styles.field}>
        <AppText variant="label">{label}</AppText>
        <View style={[styles.box, { borderColor: colors.input, backgroundColor: colors.muted }]}>
          <Lock color={colors.mutedForeground} size={14} />
          <AppText style={{ flex: 1 }} numberOfLines={1}>
            {current}
          </AppText>
        </View>
        {lockedReason && <AppText variant="muted">{lockedReason}</AppText>}
      </View>
    )
  }

  const pick = (city: string, province?: string | null) => {
    onChange(city)
    if (province && onProvince) onProvince(province)
    setOpen(false)
    setQuery('')
  }

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[
          styles.box,
          {
            borderColor: fieldState.error ? colors.destructive : colors.input,
            backgroundColor: colors.background,
          },
        ]}
      >
        <AppText style={{ flex: 1 }} variant={current ? 'body' : 'muted'} numberOfLines={1}>
          {current || t.city.placeholder}
        </AppText>
        <ChevronsUpDown color={colors.mutedForeground} size={16} />
      </Pressable>
      {fieldState.error ? <AppText variant="error">{fieldState.error.message}</AppText> : null}

      <PickerSheet
        open={open}
        title={label}
        searchLabel={t.city.search}
        query={query}
        onQuery={setQuery}
        loading={loading}
        items={items.map((hit) => ({
          key: `${hit.city}|${hit.province ?? ''}`,
          title: hit.city,
          meta: hit.province ?? undefined,
          selected: hit.city === current,
        }))}
        empty={<AppText variant="muted">{query.trim() ? t.city.noResults : t.city.typeToSearch}</AppText>}
        onPick={(key) => {
          // La clave lleva ciudad y provincia: hay ciudades con el mismo
          // nombre en dos provincias y la lista tiene que distinguirlas.
          const cut = key.indexOf('|')
          pick(cut < 0 ? key : key.slice(0, cut), cut < 0 ? null : key.slice(cut + 1) || null)
        }}
        onClose={() => setOpen(false)}
        footer={
          <View style={{ gap: spacing.sm }}>
            {/* Lo tecleado vale aunque no esté en la lista: el callejero no lo
                sabe todo y nadie debería quedarse sin comprar por eso. */}
            {query.trim().length >= 2 && (
              <Pressable accessibilityRole="button" onPress={() => pick(query.trim())}>
                <AppText variant="muted">{t.city.useTyped(query.trim())}</AppText>
              </Pressable>
            )}
            <Attribution value={credit} />
          </View>
        }
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
