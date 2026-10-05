import type { ReturnStatus } from './types'

/** Textos de posventa en el móvil. */
export const afterSalesTexts = {
  title: 'Devoluciones',
  subtitle: 'Lo que has pedido devolver y en qué punto está.',
  empty: 'Todavía no has pedido ninguna devolución.',
  loadError: 'No se pudieron cargar las devoluciones',

  statuses: {
    REQUESTED: 'Pendiente de revisar',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    RECEIVED: 'Recibida',
    REFUNDED: 'Reembolsada',
    CANCELLED: 'Cancelada',
  } satisfies Record<ReturnStatus, string>,

  units: (qty: number) => (qty === 1 ? '1 unidad' : `${qty} unidades`),
  adminNote: 'Respuesta de la tienda',
  refunded: (amount: string) => `Te hemos devuelto ${amount}`,

  cancelReturn: 'Cancelar solicitud',
  cancelReturnTitle: 'Cancelar la devolución',
  cancelReturnConfirm: 'La solicitud se anulará y podrás volver a pedirla.',
  returnCancelled: 'Devolución cancelada',

  // Solicitud desde el pedido
  returnableTitle: '¿Quieres devolver algo?',
  returnableEmpty: 'Este pedido ya no admite devoluciones.',
  returnButton: 'Devolver',
  deadline: (date: string) => `Puedes devolverlo hasta el ${date}`,
  outOfWindow: 'Fuera de plazo',
  alreadyReturned: 'Ya solicitado',
  notDelivered: 'Podrás devolverlo cuando lo recibas',

  requestTitle: (name: string) => `Devolver "${name}"`,
  requestHint: 'Cuéntanos qué ha pasado y te diremos cómo enviarlo.',
  fieldQty: 'Unidades',
  fieldReason: 'Motivo',
  send: 'Enviar solicitud',
  cancel: 'Cancelar',
  requested: 'Solicitud enviada',

  // Política en la ficha
  policyTitle: 'Devoluciones',
  policyWindow: (days: number) => `${days} días para devolverlo`,
  policyFee: (percent: number) => `Comisión de gestión del ${percent} %`,
  policyNoFee: 'Sin comisión de gestión',
  policyShipping: {
    CUSTOMER: 'El envío de vuelta lo pagas tú',
    STORE: 'Nosotros pagamos el envío de vuelta',
  },
} as const
