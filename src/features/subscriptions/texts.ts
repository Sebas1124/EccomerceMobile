/** Textos de las suscripciones en el móvil (solo español). */
export const subscriptionsTexts = {
  title: 'Hazte socio',
  subtitle: 'Una cuota al mes y las ventajas se aplican solas en cada compra.',
  loadError: 'No se pudieron cargar los planes',
  empty: 'Todavía no hay planes a la venta.',

  perMonth: 'al mes',
  choose: 'Elegir este plan',
  current: 'Tu plan',
  mine: 'Tu suscripción',
  since: (date: string) => `Socio desde el ${date}`,
  renews: (date: string) => `Se renueva el ${date}`,
  manual: 'La cuota la cobra la tienda (en caja o por transferencia).',
  statusPastDue: 'Hay un recibo pendiente de cobro.',
  statusPaused: 'Tu suscripción está en pausa.',

  subscribed: (plan: string) => `Ya eres socio del plan ${plan}`,
  subscribeError: 'No se pudo completar la suscripción',
  signIn: 'Entra en tu cuenta para hacerte socio',

  cancel: 'Darme de baja',
  cancelTitle: 'Darte de baja',
  cancelConfirm:
    'Dejarás de pagar la cuota y perderás las ventajas en la próxima renovación. Puedes volver cuando quieras.',
  cancelled: 'Suscripción cancelada',
  cancelError: 'No se pudo cancelar la suscripción',

  benefits: {
    freeShippingAlways: 'Envío gratis siempre',
    freeShippingFrom: (amount: string) => `Envío gratis desde ${amount}`,
    discount: (percent: number) => `${percent} % de descuento en todo`,
    extraReturnDays: (days: number) => `${days} días más para devolver`,
    earlyAccess: (hours: number) => `Acceso anticipado ${hours} h antes`,
    monthlyCoupon: (amount: string) => `Cupón de ${amount} cada mes`,
    cashback: (percent: number) => `${percent} % de cada compra en saldo`,
    prioritySupport: 'Atención prioritaria',
    noMinimumOrder: 'Sin pedido mínimo',
    birthdayGift: (amount: string) => `Regalo de cumpleaños de ${amount}`,
    guests: (people: number) => (people === 1 ? '1 invitado del hogar' : `${people} invitados del hogar`),
    recurringOrders: (count: number) => `Hasta ${count} pedidos recurrentes`,
    none: 'Este plan todavía no incluye ninguna ventaja.',
  },
} as const
