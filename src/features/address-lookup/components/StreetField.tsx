import { Loader, MapPin } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { radius, spacing } from '@/shared/theme/tokens'
import { addressApi, type AddressAttribution, type StreetHit } from '../api/address-lookup-api'
import { addressTexts as t } from '../texts'
import { Attribution } from './Attribution'

const DEBOUNCE_MS = 350
/** Por debajo de esto el callejero devuelve media ciudad. */
const MIN_CHARS = 3

/**
 * Campo de calle con callejero.
 *
 * Sugiere mientras se escribe y, al elegir, deja la vía puesta para que solo
 * haya que añadir el número y el piso: eso es lo que el callejero no sabe y lo
 * que más se equivoca al teclear, sobre todo en un teclado de móvil.
 *
 * Si la tienda no tiene callejero configurado no hay sugerencias y el campo se
 * comporta como un campo de texto normal.
 */
export function StreetField<T extends FieldValues>({
  control,
  name,
  label,
  city,
  country,
  description,
  onPick,
}: {
  control: Control<T>
  name: FieldPath<T>
  label: string
  city: string
  country: string
  description?: string
  /** Cuando se elige una sugerencia, con lo que el callejero sepa. */
  onPick?: (hit: StreetHit) => void
}) {
  const colors = useColors()
  const {
    field: { value, onChange, onBlur },
    fieldState,
  } = useController({ control, name })
  const [items, setItems] = useState<StreetHit[]>([])
  const [credit, setCredit] = useState<AddressAttribution | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  /** Lo elegido no se vuelve a buscar: si no, la lista reaparece sola. */
  const justPicked = useRef(false)

  const text = String(value ?? '')

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false
      return
    }
    if (!city || text.trim().length < MIN_CHARS) return

    let alive = true
    const handle = setTimeout(() => {
      setLoading(true)
      addressApi
        .streets(text.trim(), city, country)
        .then(({ items: hits, attribution }) => {
          if (!alive) return
          setItems(hits)
          setCredit(attribution)
          setOpen(hits.length > 0)
        })
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
  }, [text, city, country])

  // Derivado en vez de borrado en el efecto: lo que se enseña depende de lo
  // escrito, y vaciarlo con un `setState` encadenaría renders.
  const visible = city && text.trim().length >= MIN_CHARS ? items : []

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>

      <View
        style={[
          styles.input,
          {
            borderColor: fieldState.error ? colors.destructive : focused ? colors.primary : colors.input,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={onChange}
          onFocus={() => {
            setFocused(true)
            setOpen(visible.length > 0)
          }}
          onBlur={() => {
            setFocused(false)
            onBlur()
          }}
          accessibilityLabel={label}
          autoComplete="street-address"
          autoCorrect={false}
          style={[styles.control, { color: colors.foreground }]}
        />
        {loading && <Loader color={colors.mutedForeground} size={16} />}
      </View>

      {open && visible.length > 0 && (
        <View style={[styles.list, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {visible.map((hit) => (
            <Pressable
              key={hit.label}
              accessibilityRole="button"
              // Al elegir se cierra la lista: en el móvil ocupa media pantalla
              // y dejarla abierta tapa el resto del formulario.
              onPress={() => {
                justPicked.current = true
                onChange(hit.street)
                onPick?.(hit)
                setOpen(false)
              }}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.muted }]}
            >
              <MapPin color={colors.mutedForeground} size={14} />
              <View style={{ flex: 1 }}>
                <AppText numberOfLines={1}>{hit.street}</AppText>
                <AppText variant="muted" style={{ fontSize: 12 }} numberOfLines={1}>
                  {hit.label}
                </AppText>
              </View>
            </Pressable>
          ))}
          <Attribution value={credit} />
        </View>
      )}

      {fieldState.error ? (
        <AppText variant="error">{fieldState.error.message}</AppText>
      ) : (
        <AppText variant="muted">{description ?? t.street.help}</AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  control: { flex: 1, paddingVertical: spacing.md, fontSize: 15 },
  list: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
})
