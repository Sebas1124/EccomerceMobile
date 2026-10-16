import { api } from '@/shared/lib/api-client'

/**
 * Pagos en el móvil.
 *
 * El cobro no se hace aquí: se pide un enlace y se abre la pantalla de pago de
 * la web en un navegador. Por eso esto es tan corto.
 */
export const paymentsApi = {
  /** Enlace de un solo pedido, válido media hora. */
  issueLink: (orderNumber: string) =>
    api.post<{ url: string; expiresAt: string }>(`/payments/orders/${orderNumber}/link`, {}),
}
