import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Screen } from '@/shared/components/Screen'
import { confirm, notify } from '@/shared/feedback'
import { AppForm, yup, type FieldConfig } from '@/shared/forms'
import { radius, spacing } from '@/shared/theme/tokens'
import { accountApi } from '../api/account-api'
import { accountTexts as t, countryName } from '../texts'
import type { Address, AddressValues } from '../types'

const schema: yup.ObjectSchema<AddressValues> = yup.object({
  label: yup.string().trim().max(40).defined(),
  fullName: yup.string().trim().min(3).max(120).required(),
  street: yup.string().trim().min(3).max(160).required(),
  // El formato exacto depende del país y lo valida el servidor.
  postalCode: yup.string().trim().min(3).max(12).required(),
  city: yup.string().trim().min(2).max(80).required(),
  province: yup.string().trim().max(80).defined(),
  phone: yup.string().trim().max(30).defined(),
})

const fields: FieldConfig<AddressValues>[] = [
  { kind: 'text', name: 'label', label: t.fieldLabel },
  { kind: 'text', name: 'fullName', label: t.fieldFullName, autoComplete: 'name' },
  { kind: 'text', name: 'street', label: t.fieldStreet, autoComplete: 'street-address' },
  { kind: 'text', name: 'postalCode', label: t.fieldPostalCode, keyboardType: 'number-pad' },
  { kind: 'text', name: 'city', label: t.fieldCity },
  { kind: 'text', name: 'province', label: t.fieldProvince },
  { kind: 'text', name: 'phone', label: t.fieldPhone, keyboardType: 'phone-pad' },
]

const emptyValues: AddressValues = {
  label: '',
  fullName: '',
  street: '',
  postalCode: '',
  city: '',
  province: '',
  phone: '',
}

const toValues = (address: Address): AddressValues => ({
  label: address.label ?? '',
  fullName: address.fullName,
  street: address.street,
  postalCode: address.postalCode,
  city: address.city,
  province: address.province ?? '',
  phone: address.phone ?? '',
})

/**
 * Alta y edición. El móvil solo maneja direcciones de envío en España: las de
 * facturación y otros países se editan desde la web, donde cabe el formulario
 * entero sin apretujarlo.
 */
function AddressForm({
  address,
  onDone,
  onCancel,
}: {
  address?: Address
  onDone: () => void
  onCancel: () => void
}) {
  return (
    <Card
      title={address ? t.editAddress : t.newAddress}
      description={t.addressFormHint}
    >
      <AppForm<AddressValues>
        schema={schema}
        defaultValues={address ? toValues(address) : emptyValues}
        fields={fields}
        submitLabel={t.saveAddress}
        onSubmit={async (values) => {
          const payload = {
            kind: 'SHIPPING' as const,
            label: values.label || null,
            fullName: values.fullName,
            street: values.street,
            street2: null,
            city: values.city,
            province: values.province || null,
            postalCode: values.postalCode,
            country: address?.country ?? 'ES',
            phone: values.phone || null,
            notes: null,
            isDefault: address?.isDefault ?? false,
          }
          if (address) {
            await accountApi.updateAddress(address.id, payload)
            notify.success(t.addressUpdated)
          } else {
            await accountApi.createAddress(payload)
            notify.success(t.addressCreated)
          }
          onDone()
        }}
      />
      <Button label={t.cancel} variant="ghost" onPress={onCancel} />
    </Card>
  )
}

export function AddressesScreen() {
  const colors = useColors()
  const [items, setItems] = useState<Address[] | null>(null)
  const [version, setVersion] = useState(0)
  const [editing, setEditing] = useState<Address | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let alive = true
    accountApi
      .addresses()
      .then(({ items: loaded }) => {
        if (alive) setItems(loaded)
      })
      .catch((error: unknown) => notify.fromError(error, t.loadError))
    return () => {
      alive = false
    }
  }, [version])

  const reload = () => {
    setVersion((value) => value + 1)
    setCreating(false)
    setEditing(null)
  }

  if (creating || editing) {
    return (
      <Screen>
        <AddressForm
          address={editing ?? undefined}
          onDone={reload}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t.addressesTitle}</AppText>
        <AppText variant="muted">{t.addressesSubtitle}</AppText>
      </View>

      <Button label={t.newAddress} icon={Plus} onPress={() => setCreating(true)} />

      {items?.length === 0 && (
        <Card>
          <View style={styles.empty}>
            <MapPin color={colors.mutedForeground} size={32} />
            <AppText variant="muted">{t.noAddresses}</AppText>
          </View>
        </Card>
      )}

      {items?.map((address) => (
        <Card key={address.id}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <AppText style={{ fontSize: 12 }}>{t.kinds[address.kind]}</AppText>
            </View>
            {address.isDefault && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <AppText style={{ fontSize: 12, color: colors.primaryForeground }}>
                  {t.defaultBadge}
                </AppText>
              </View>
            )}
            {address.label && <AppText variant="muted">{address.label}</AppText>}
          </View>

          <View>
            <AppText style={{ fontWeight: '500' }}>{address.fullName}</AppText>
            <AppText variant="muted">{address.street}</AppText>
            <AppText variant="muted">
              {address.postalCode} {address.city}
              {address.province ? ` (${address.province})` : ''}
            </AppText>
            <AppText variant="muted">{countryName(address.country)}</AppText>
            {address.phone && <AppText variant="muted">{address.phone}</AppText>}
          </View>

          <View style={styles.actions}>
            <Button
              label={t.editAddress}
              variant="outline"
              icon={Pencil}
              fullWidth={false}
              onPress={() => setEditing(address)}
            />
            {!address.isDefault && (
              <Button
                label={t.setDefault}
                variant="ghost"
                icon={Star}
                fullWidth={false}
                onPress={() => {
                  void accountApi.setDefaultAddress(address.id).then(() => {
                    notify.success(t.defaultSet)
                    reload()
                  })
                }}
              />
            )}
            <Button
              label={t.removeAddress}
              variant="ghost"
              icon={Trash2}
              fullWidth={false}
              onPress={() =>
                void confirm({
                  title: t.removeAddressTitle,
                  description: t.removeAddressConfirm,
                  tone: 'danger',
                  confirmLabel: t.removeAddress,
                  action: async () => {
                    await accountApi.removeAddress(address.id)
                    notify.success(t.addressRemoved)
                    reload()
                  },
                })
              }
            />
          </View>
        </Card>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
})
