/** Textos de pago en el móvil. */
export const paymentsTexts = {
  pendingTitle: 'Pendiente de pago',
  pendingHint: 'Tu pedido está guardado. Puedes pagarlo cuando quieras.',
  payNow: (amount: string) => `Pagar ${amount}`,
  opensBrowser: 'Se abre la pantalla de pago segura. Al terminar, vuelves aquí.',
  payError: 'No se pudo abrir el pago',
  payWith: (label: string) => `Pagar con ${label}`,
  payWithHint: 'Sin teclear nada. Si tu banco pide confirmación, se abre el navegador.',
  payOther: 'Pagar de otra forma',
  paidOk: 'Pago enviado',
  needsBrowser: 'Tu banco quiere confirmarlo: seguimos en el navegador.',

  /** Formas de pago guardadas. */
  saved: {
    title: 'Métodos de pago',
    subtitle:
      'Lo que dejes guardado —tarjeta, PayPal o Klarna— para no volver a teclearlo. Los datos los guarda la pasarela, no esta tienda.',
    empty: 'Todavía no has guardado ninguna forma de pago.',
    add: 'Guardar una forma de pago',
    addHint: 'Se abre la pantalla segura de la pasarela. Al terminar, vuelves aquí.',
    addError: 'No se pudo abrir el formulario',
    unavailable: 'La tienda no guarda formas de pago ahora mismo.',
    loadError: 'No se pudieron cargar tus formas de pago',
    default: 'Por defecto',
    setDefault: 'Usar por defecto',
    defaultSet: 'Será la primera opción al pagar',
    expires: (value: string) => `Caduca ${value}`,
    expired: 'Caducada',
    remove: 'Quitar',
    removeTitle: '¿Quitar esta forma de pago?',
    removeConfirm:
      'Se borra de la pasarela y habrá que volver a darla de alta para usarla. Los pedidos ya pagados no se tocan.',
    removed: 'Forma de pago quitada',
  },
} as const
