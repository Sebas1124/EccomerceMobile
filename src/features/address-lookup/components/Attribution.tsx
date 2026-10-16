import { ExternalLink } from 'lucide-react-native'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { spacing } from '@/shared/theme/tokens'
import type { AddressAttribution } from '../api/address-lookup-api'
import { addressTexts as t } from '../texts'

/**
 * Crédito del callejero.
 *
 * Las licencias de los callejeros abiertos —OpenStreetMap entre ellas— piden
 * acreditar a quien hizo los datos **donde se enseñan**, no en una pantalla de
 * créditos escondida. Así que va pegado a la lista de sugerencias, y aparece
 * solo cuando hay un proveedor detrás: con el callejero apagado no hay nada
 * que acreditar.
 */
export function Attribution({ value }: { value: AddressAttribution | null }) {
  const colors = useColors()
  if (!value) return null

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t.attribution}
        onPress={() => void Linking.openURL(value.href)}
        style={styles.row}
      >
        <AppText variant="muted" style={{ fontSize: 11 }}>
          {value.text}
        </AppText>
        <ExternalLink color={colors.mutedForeground} size={11} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
})
