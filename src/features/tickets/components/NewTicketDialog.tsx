import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { AppForm, yup, type FieldConfig } from '@/shared/forms'
import { radius, spacing } from '@/shared/theme/tokens'
import { ticketsApi } from '../api/tickets-api'
import { ticketsTexts as t } from '../texts'

interface Values {
  subject: string
  body: string
  orderNumber: string
}

const schema: yup.ObjectSchema<Values> = yup.object({
  subject: yup.string().trim().min(3).max(140).required(),
  body: yup.string().trim().min(5).max(4000).required(),
  orderNumber: yup.string().trim().max(30).defined(),
})

const fields: FieldConfig<Values>[] = [
  { kind: 'text', name: 'subject', label: t.fieldSubject },
  { kind: 'text', name: 'body', label: t.fieldBody, rows: 5 },
  {
    kind: 'text',
    name: 'orderNumber',
    label: t.fieldOrder,
    description: t.fieldOrderHint,
    autoCapitalize: 'characters',
  },
]

/** Alta de una consulta. */
export function NewTicketDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const colors = useColors()

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(150)}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar"
        />
        <Animated.View
          entering={ZoomIn.duration(180)}
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <ScrollView contentContainerStyle={{ gap: spacing.md }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: spacing.xs }}>
              <AppText variant="subtitle">{t.create}</AppText>
              <AppText variant="muted" style={{ fontSize: 13 }}>
                {t.createHint}
              </AppText>
            </View>

            {/* Con `key` el formulario nace limpio cada vez que se abre. */}
            <AppForm<Values>
              key={open ? 'abierto' : 'cerrado'}
              schema={schema}
              defaultValues={{ subject: '', body: '', orderNumber: '' }}
              fields={fields}
              submitLabel={t.send}
              onSubmit={async (values) => {
                await ticketsApi.create({
                  subject: values.subject,
                  body: values.body,
                  orderNumber: values.orderNumber || null,
                })
                onCreated()
                onClose()
              }}
            />

            <Button label="Cancelar" variant="outline" onPress={onClose} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  dialog: {
    width: '100%',
    maxHeight: '85%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
})
