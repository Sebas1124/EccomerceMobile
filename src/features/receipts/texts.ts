/** Textos del recibo de pago manual en el móvil. */
export const receiptsTexts = {
  title: 'Recibo del pedido',
  notAnInvoice:
    'Esto no es una factura. Es el resguardo de tu pedido mientras se acuerda el pago; la factura te llega cuando el pago se confirme.',
  issuedOn: (date: string) => `Emitido el ${date}`,
  share: 'Enviar el recibo',
  download: 'Descargar recibo',
  howToPay: 'Cómo pagar',
  nextStep: 'Cuando recibamos el pago, cambiaremos el estado del pedido y te avisaremos.',
  loadError: 'No se pudo cargar el recibo',
  shareError: 'No se pudo enviar el recibo',
} as const
