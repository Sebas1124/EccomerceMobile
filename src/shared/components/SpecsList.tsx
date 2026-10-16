import { TriangleAlert } from 'lucide-react-native'
import { View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { radius, spacing } from '@/shared/theme/tokens'

/**
 * Una fila de la ficha técnica.
 * Espejo de `backend/src/modules/catalog/product-specs.ts`.
 */
export interface SpecRow {
  group?: string
  label: string
  kind: 'text' | 'list'
  value: string | string[]
  /** Fila que destaca: los alérgenos, por ejemplo. */
  emphasis?: boolean
}

/** Agrupa conservando el orden, con las filas sin grupo delante. */
function byGroup(rows: SpecRow[]) {
  const groups = new Map<string, SpecRow[]>()
  for (const row of rows) {
    const key = row.group?.trim() || ''
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return [...groups.entries()].sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : 0))
}

/**
 * Ficha técnica del producto.
 *
 * En móvil la etiqueta va encima del valor y no al lado: con 360 puntos de
 * ancho, dos columnas dejan el valor en una tira de texto cortada.
 */
export function SpecsList({ rows }: { rows: SpecRow[] }) {
  const colors = useColors()
  if (rows.length === 0) return null

  return (
    <View style={{ gap: spacing.lg }}>
      {byGroup(rows).map(([group, items]) => (
        <View key={group || 'general'} style={{ gap: spacing.sm }}>
          {group ? (
            <AppText variant="muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>
              {group}
            </AppText>
          ) : null}

          {items.map((row, index) => (
            <View
              key={`${row.label}-${index}`}
              style={{
                gap: 2,
                // El recuadro con borde de aviso es lo que separa un alérgeno
                // de un dato más de la lista.
                ...(row.emphasis
                  ? {
                      borderRadius: radius.lg,
                      padding: spacing.md,
                      borderWidth: 1,
                      borderColor: colors.warning,
                    }
                  : {}),
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                {row.emphasis ? <TriangleAlert size={14} color={colors.warning} /> : null}
                <AppText variant="muted" style={{ fontSize: 13 }}>
                  {row.label}
                </AppText>
              </View>

              {Array.isArray(row.value) ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {row.value.map((item) => (
                    <View
                      key={item}
                      style={{
                        backgroundColor: colors.muted,
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                      }}
                    >
                      <AppText style={{ fontSize: 13 }}>{item}</AppText>
                    </View>
                  ))}
                </View>
              ) : (
                <AppText style={{ lineHeight: 20 }}>{row.value}</AppText>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
