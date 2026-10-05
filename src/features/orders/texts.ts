import type { OrderStatus } from './types'

/** Textos de pedidos en el móvil. */
export const ordersTexts = {
  title: 'Mis pedidos',
  empty: 'Todavía no has hecho ningún pedido.',
  emptyAction: 'Ver el catálogo',
  loadError: 'No se pudieron cargar los pedidos',
  detailError: 'No se pudo cargar el pedido',

  statuses: {
    PENDING_PAYMENT: 'Pendiente de pago',
    PAID: 'Pagado',
    PREPARING: 'Preparando',
    READY_FOR_PICKUP: 'Listo para recoger',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
    PARTIALLY_REFUNDED: 'Reembolsado en parte',
  } satisfies Record<OrderStatus, string>,

  orderNumber: (number: string) => `Pedido ${number}`,
  placedOn: (date: string) => `Realizado el ${date}`,
  items: (count: number) => (count === 1 ? '1 artículo' : `${count} artículos`),

  product: 'Producto',
  quantity: 'Cantidad',
  unitPrice: 'Precio unidad',
  timeline: 'Seguimiento',
  shippingTo: 'Envío a',
  shipment: 'Envío',
  tracking: 'Número de seguimiento',
  noShipment: 'Todavía no hemos solicitado el envío.',

  subtotal: 'Base imponible',
  tax: (rate: number) => `IVA (${rate}%)`,
  discounts: 'Descuentos',
  shipping: 'Gastos de envío',
  total: 'Total',
  invoiceNote: 'Los precios incluyen IVA.',
  paymentPending: 'Te avisaremos en cuanto confirmemos el pago.',

  cancel: 'Cancelar pedido',
  cancelTitle: (number: string) => `Cancelar el pedido ${number}`,
  cancelConfirm: 'Se liberarán las unidades y no se podrá deshacer.',
  cancelled: (number: string) => `Pedido ${number} cancelado`,
} as const
