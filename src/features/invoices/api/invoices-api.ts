import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { api, API_BASE, signedHeaders } from '@/shared/lib/api-client'

export interface Invoice {
  id: string
  number: string
  issuedAt: string
  subtotalCents: number
  vatCents: number
  totalCents: number
  order: { number: string }
}

/** Factura rectificativa: corrige a una factura. Sus importes van en negativo. */
export interface CreditNote {
  id: string
  number: string
  issuedAt: string
  reason: string
  subtotalCents: number
  vatCents: number
  totalCents: number
}

/**
 * Baja un PDF protegido a la cache y abre la hoja de compartir.
 *
 * No vale un enlace normal: estos endpoints piden el access token y la prueba
 * DPoP, que solo viven en memoria.
 */
async function sharePdf(path: string, fileName: string, dialogTitle: string) {
  const destination = new File(Paths.cache, fileName)
  // Una descarga anterior dejaria el fichero ocupado.
  if (destination.exists) destination.delete()

  const task = File.createDownloadTask(`${API_BASE}${path}`, destination, {
    headers: await signedHeaders(path),
  })
  const file = await task.downloadAsync()
  if (!file) throw new Error('La descarga no se completo')

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este dispositivo no permite compartir archivos')
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle,
  })
}

export const invoicesApi = {
  mine: () => api.get<{ items: Invoice[]; total: number }>('/me/invoices'),

  /** La factura de un pedido. Devuelve 404 mientras no se ha emitido. */
  forOrder: (orderNumber: string) => api.get<{ invoice: Invoice }>(`/me/invoices/${orderNumber}`),

  /**
   * Baja el PDF a la caché y abre la hoja de compartir, que es de donde el
   * usuario lo guarda, lo imprime o lo manda a su gestoría.
   */
  share: (orderNumber: string, invoiceNumber: string) =>
    sharePdf(
      `/me/invoices/${orderNumber}/pdf`,
      `factura-${invoiceNumber}.pdf`,
      `Factura ${invoiceNumber}`,
    ),
}

export const creditNotesApi = {
  /** Las rectificativas de un pedido. Lo normal es que no haya ninguna. */
  forOrder: (orderNumber: string) =>
    api.get<{ items: CreditNote[]; total: number }>(
      `/me/credit-notes?order=${encodeURIComponent(orderNumber)}`,
    ),

  share: (number: string) =>
    sharePdf(
      `/me/credit-notes/${number}/pdf`,
      `rectificativa-${number}.pdf`,
      `Factura rectificativa ${number}`,
    ),
}
