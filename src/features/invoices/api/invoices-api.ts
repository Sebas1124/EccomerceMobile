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

export const invoicesApi = {
  mine: () => api.get<{ items: Invoice[]; total: number }>('/me/invoices'),

  /** La factura de un pedido. Devuelve 404 mientras no se ha emitido. */
  forOrder: (orderNumber: string) => api.get<{ invoice: Invoice }>(`/me/invoices/${orderNumber}`),

  /**
   * Baja el PDF a la caché y abre la hoja de compartir, que es de donde el
   * usuario lo guarda, lo imprime o lo manda a su gestoría.
   */
  async share(orderNumber: string, invoiceNumber: string) {
    const path = `/me/invoices/${orderNumber}/pdf`
    const destination = new File(Paths.cache, `factura-${invoiceNumber}.pdf`)
    // Una descarga anterior dejaría el fichero ocupado.
    if (destination.exists) destination.delete()

    const task = File.createDownloadTask(`${API_BASE}${path}`, destination, {
      headers: await signedHeaders(path),
    })
    const file = await task.downloadAsync()
    if (!file) throw new Error('La descarga de la factura no se completó')

    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Este dispositivo no permite compartir archivos')
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Factura ${invoiceNumber}`,
    })
  },
}
