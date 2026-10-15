/** Textos de facturación en el móvil. */
export const invoicesTexts = {
  title: 'Factura',
  issuedOn: (date: string) => `Emitida el ${date}`,
  download: 'Descargar PDF',
  loadError: 'No se pudo comprobar la factura',
  downloadError: 'No se pudo descargar la factura',

  rectifying: {
    title: 'Facturas rectificativas',
    help: 'Corrigen la factura por el importe que se te ha devuelto.',
    issuedOn: (date: string) => `Emitida el ${date}`,
    share: 'Descargar',
    downloadError: 'No se pudo descargar la factura rectificativa',
  },
} as const
