/** Textos del checkout en el móvil. */
export const checkoutTexts = {
  title: 'Finalizar compra',
  subtitle: 'Revisa la dirección y confirma el pedido.',
  startError: 'No se pudo abrir el checkout',
  loadError: 'No se pudo cargar el checkout',

  timeLeft: (time: string) => `Te quedan ${time} para completar la compra`,
  expired: 'Se ha agotado el tiempo y hemos liberado tu reserva.',
  expiredAction: 'Volver al carrito',
  reserved: 'Stock reservado',

  addressTitle: 'Dirección de envío',
  fieldFullName: 'Nombre y apellidos',
  fieldStreet: 'Dirección',
  fieldPostalCode: 'Código postal',
  fieldCity: 'Ciudad',
  fieldProvince: 'Provincia',
  fieldPhone: 'Teléfono',
  fieldNotes: 'Notas para la entrega',
  saveAddress: 'Guardar dirección',
  addressSaved: 'Dirección guardada',
  needAddress: 'Escribe la dirección de envío antes de confirmar',

  summary: 'Resumen',
  subtotal: 'Base imponible',
  tax: (rate: number) => `IVA (${rate}%)`,
  discounts: 'Descuentos',
  shipping: 'Gastos de envío',
  shippingFree: 'Gratis',
  total: 'Total',
  taxIncluded: 'Impuestos incluidos',

  promoLabel: '¿Tienes un cupón?',
  promoPlaceholder: 'Escribe tu código',
  promoApply: 'Aplicar',
  promoApplied: (code: string) => `Cupón ${code} aplicado`,
  promoRemove: 'Quitar cupón',
  promoRemoved: 'Cupón quitado',
  promoLine: 'Cupón',

  paymentTitle: 'Forma de pago',
  confirm: 'Confirmar pedido',
  confirming: 'Confirmando...',
  confirmNotice:
    'Al confirmar reservamos tu pedido y te indicamos cómo pagarlo. Todavía no se cobra nada.',
  placed: (number: string) => `Pedido ${number} creado`,
  placeError: 'No se pudo confirmar el pedido',

  cancel: 'Cancelar compra',
  cancelTitle: 'Cancelar la compra',
  cancelConfirm: 'Liberaremos la reserva y volverás al carrito.',
  cancelled: 'Compra cancelada',
} as const
