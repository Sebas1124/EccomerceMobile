import type { TicketStatus } from './api/tickets-api'

/** Textos de soporte en el móvil. */
export const ticketsTexts = {
  title: 'Soporte',
  subtitle: 'Tus consultas con la tienda.',
  empty: 'Todavía no has abierto ninguna consulta.',
  loadError: 'No se pudieron cargar tus consultas',

  statuses: {
    OPEN: 'Abierta',
    WAITING_CUSTOMER: 'Te hemos contestado',
    IN_PROGRESS: 'En curso',
    RESOLVED: 'Resuelta',
    CLOSED: 'Cerrada',
  } satisfies Record<TicketStatus, string>,

  create: 'Nueva consulta',
  createHint: 'Cuéntanos qué pasa. Te contestamos por aquí y por correo.',
  fieldSubject: 'Asunto',
  fieldBody: 'Cuéntanos',
  fieldOrder: 'Pedido relacionado',
  fieldOrderHint: 'Opcional. Por ejemplo P-2026-0001.',
  send: 'Enviar consulta',
  created: 'Consulta enviada',

  openedOn: (date: string) => `Abierta el ${date}`,
  aboutOrder: (order: string) => `Sobre el pedido ${order}`,
  you: 'Tú',
  store: 'La tienda',
  reply: 'Responder',
  replyPlaceholder: 'Escribe tu respuesta',
  replied: 'Respuesta enviada',
  closeTicket: 'Dar por resuelta',
  closeTitle: '¿Dar la consulta por resuelta?',
  closeConfirm: 'Podrás abrir otra si vuelves a necesitarnos.',
  closed: 'Consulta cerrada',
  closedNotice: 'Esta consulta está cerrada. Abre una nueva si necesitas algo más.',
  notFound: 'Esa consulta no existe.',
} as const
