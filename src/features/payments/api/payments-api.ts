import { api } from '@/shared/lib/api-client'

/**
 * Pagos en el móvil.
 *
 * El cobro no se hace aquí: se pide un enlace y se abre la pantalla de pago de
 * la web en un navegador. Por eso esto es tan corto.
 */
/** Lo guardado por esta persona, tal y como lo cuenta la pasarela. */
export interface SavedMethod {
  providerId: string
  token: string
  kind: 'card' | 'paypal' | 'wallet' | 'other'
  label: string
  /** "2029-04", si la pasarela lo dice. */
  expiresAt?: string
  isDefault: boolean
}

export const paymentsApi = {
  /** Enlace de un solo pedido, válido media hora. */
  issueLink: (orderNumber: string) =>
    api.post<{ url: string; expiresAt: string }>(`/payments/orders/${orderNumber}/link`, {}),

  /**
   * Cobra el pedido con un método ya guardado.
   *
   * Sin `returnUrl`: la app no tiene a dónde volver en la web, y cobrando con
   * un método guardado la pasarela suele terminar en la misma llamada.
   */
  payWithSaved: (orderNumber: string, providerId: string, savedToken: string) =>
    api.post<{ status: string; clientAction: { type: string; value?: string; url?: string } | null }>(
      `/payments/orders/${orderNumber}/pay`,
      { providerId, savedToken },
    ),

  methods: (providerId = 'stripe') =>
    api
      .get<{ providers: string[]; items: SavedMethod[] }>(
        `/me/payment-methods?providerId=${providerId}`,
      )
      // Con la funcionalidad apagada la ruta responde 404: lista vacía y ya.
      .catch(() => ({ providers: [] as string[], items: [] as SavedMethod[] })),

  /**
   * Enlace para dar de alta una forma de pago en el navegador.
   *
   * El formulario es de la pasarela y aquí no cabe sin un development build,
   * así que se abre fuera, igual que el pago.
   */
  issueSetupLink: (providerId = 'stripe') =>
    api.post<{ url: string; expiresAt: string }>('/me/payment-methods/link', { providerId }),

  setDefaultMethod: (token: string, providerId = 'stripe') =>
    api.patch<void>(`/me/payment-methods/${token}/default`, { providerId }),

  removeMethod: (token: string, providerId = 'stripe') =>
    api.delete<void>(`/me/payment-methods/${token}?providerId=${providerId}`),
}
