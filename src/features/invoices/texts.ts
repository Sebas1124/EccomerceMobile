/** Textos de facturación en el móvil. */
export const invoicesTexts = {
  title: 'Factura',
  issuedOn: (date: string) => `Emitida el ${date}`,
  download: 'Descargar PDF',
  loadError: 'No se pudo comprobar la factura',
  downloadError: 'No se pudo descargar la factura',
} as const
