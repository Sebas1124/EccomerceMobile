/** Textos de pago en el móvil. */
export const paymentsTexts = {
  pendingTitle: 'Pendiente de pago',
  pendingHint: 'Tu pedido está guardado. Puedes pagarlo cuando quieras.',
  payNow: (amount: string) => `Pagar ${amount}`,
  opensBrowser: 'Se abre la pantalla de pago segura. Al terminar, vuelves aquí.',
  payError: 'No se pudo abrir el pago',
} as const
