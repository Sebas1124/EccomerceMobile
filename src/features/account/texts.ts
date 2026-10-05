import type { AddressKind } from './types'

/** Textos de la cuenta en el móvil. */
export const accountTexts = {
  loadError: 'No se pudieron cargar tus datos',

  // Datos personales
  profileTitle: 'Datos personales',
  profileHint: 'Así te llamamos en los pedidos y en los avisos.',
  fieldFirstName: 'Nombre',
  fieldLastName: 'Apellidos',
  fieldPhone: 'Teléfono',
  saveProfile: 'Guardar cambios',
  profileSaved: 'Datos actualizados',

  pendingEmail: (email: string) => `Tienes un cambio de email pendiente a ${email}.`,
  emailOnWeb: 'El cambio de email se termina desde la web.',

  // Direcciones
  addressesTitle: 'Direcciones',
  addressesSubtitle: 'Las que te proponemos al finalizar la compra.',
  newAddress: 'Nueva dirección',
  noAddresses: 'Todavía no has guardado ninguna dirección.',
  kinds: {
    SHIPPING: 'Envío',
    BILLING: 'Facturación',
  } satisfies Record<AddressKind, string>,
  defaultBadge: 'Por defecto',
  setDefault: 'Usar por defecto',
  defaultSet: 'Dirección por defecto actualizada',
  editAddress: 'Editar',
  removeAddress: 'Eliminar',
  removeAddressTitle: 'Eliminar dirección',
  removeAddressConfirm: 'Dejará de aparecer al finalizar la compra.',
  addressRemoved: 'Dirección eliminada',
  addressCreated: 'Dirección guardada',
  addressUpdated: 'Dirección actualizada',
  addressFormHint: 'Solo enviamos a países de la Unión Europea.',
  fieldLabel: 'Nombre para ti',
  fieldFullName: 'Nombre y apellidos',
  fieldStreet: 'Dirección',
  fieldCity: 'Ciudad',
  fieldProvince: 'Provincia',
  fieldPostalCode: 'Código postal',
  saveAddress: 'Guardar dirección',
  cancel: 'Cancelar',

  // Baja
  dangerTitle: 'Eliminar mi cuenta',
  dangerHint:
    'Se borran tus datos personales pasados 30 días. Tus pedidos se conservan sin tu nombre porque la ley nos obliga a guardarlos.',
  fieldReason: '¿Por qué te vas? (opcional)',
  requestDeletion: 'Solicitar la baja',
  deletionCodeSent: 'Te hemos enviado un código para confirmar la baja',
  deletionPending: 'Escribe el código que te hemos enviado para confirmar la baja.',
  fieldCode: 'Código de 6 dígitos',
  confirmDeletion: 'Confirmar la baja',
  deletionScheduled: (date: string) =>
    `Tu cuenta se eliminará el ${date}. Puedes cancelarlo hasta esa fecha.`,
  cancelDeletion: 'Cancelar la baja',
  deletionCancelled: 'Hemos cancelado la baja de tu cuenta',
  deletionConfirmTitle: 'Solicitar la baja de tu cuenta',
  deletionConfirmBody:
    'Te enviaremos un código para confirmarlo. Podrás cancelarlo durante 30 días.',
} as const

/** Países de la UE con su nombre en español. */
export const EU_COUNTRIES = [
  { value: 'ES', label: 'España' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Bélgica' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'CY', label: 'Chipre' },
  { value: 'CZ', label: 'Chequia' },
  { value: 'DE', label: 'Alemania' },
  { value: 'DK', label: 'Dinamarca' },
  { value: 'EE', label: 'Estonia' },
  { value: 'FI', label: 'Finlandia' },
  { value: 'FR', label: 'Francia' },
  { value: 'GR', label: 'Grecia' },
  { value: 'HR', label: 'Croacia' },
  { value: 'HU', label: 'Hungría' },
  { value: 'IE', label: 'Irlanda' },
  { value: 'IT', label: 'Italia' },
  { value: 'LT', label: 'Lituania' },
  { value: 'LU', label: 'Luxemburgo' },
  { value: 'LV', label: 'Letonia' },
  { value: 'MT', label: 'Malta' },
  { value: 'NL', label: 'Países Bajos' },
  { value: 'PL', label: 'Polonia' },
  { value: 'PT', label: 'Portugal' },
  { value: 'RO', label: 'Rumanía' },
  { value: 'SE', label: 'Suecia' },
  { value: 'SI', label: 'Eslovenia' },
  { value: 'SK', label: 'Eslovaquia' },
] as const

/** "ES" → "España". */
export const countryName = (code: string) =>
  EU_COUNTRIES.find((country) => country.value === code)?.label ?? code
