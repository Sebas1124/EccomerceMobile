import { ExternalLink, MessageCircle, Phone } from 'lucide-react-native'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { useAppConfigStore } from '@/features/app-config'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { spacing } from '@/shared/theme/tokens'

/** Nombres de las redes. Los iconos de marca no están en Lucide. */
const NAMES: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  web: 'Web',
}

/**
 * Contacto y redes al final del cajón.
 *
 * Es lo que en la web vive en el pie. En la app no hay pie —se navega por
 * pestañas y por este cajón—, así que el sitio natural es el final de la lista,
 * debajo de todo lo demás.
 *
 * Lo que la tienda no haya rellenado no ocupa sitio.
 */
export function DrawerContact() {
  const colors = useColors()
  const contact = useAppConfigStore((state) => state.config.contact)

  const hasAny = contact.phone || contact.whatsapp || contact.location || contact.social.length > 0
  if (!hasAny) return null

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border }]}>
      {contact.phone && (
        <Pressable
          accessibilityRole="link"
          style={styles.row}
          onPress={() => void Linking.openURL(`tel:${contact.phone.replace(/\s/g, '')}`)}
        >
          <Phone color={colors.mutedForeground} size={14} />
          <AppText style={{ fontSize: 13 }}>{contact.phone}</AppText>
        </Pressable>
      )}

      {contact.whatsapp && (
        <Pressable
          accessibilityRole="link"
          style={styles.row}
          onPress={() => void Linking.openURL(`https://wa.me/${contact.whatsapp}`)}
        >
          <MessageCircle color={colors.mutedForeground} size={14} />
          <AppText style={{ fontSize: 13 }}>WhatsApp</AppText>
        </Pressable>
      )}

      {contact.location && (
        <AppText variant="muted" style={{ fontSize: 12 }}>
          {contact.location}
        </AppText>
      )}

      {contact.social.map((link) => (
        <Pressable
          key={`${link.platform}-${link.url}`}
          accessibilityRole="link"
          style={styles.row}
          onPress={() => void Linking.openURL(link.url)}
        >
          <ExternalLink color={colors.mutedForeground} size={14} />
          <AppText style={{ fontSize: 13 }}>{NAMES[link.platform] ?? link.platform}</AppText>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
})
