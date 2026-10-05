import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { api, API_BASE, signedHeaders } from '@/shared/lib/api-client'

export type ManualChannel = 'whatsapp' | 'telegram' | 'none'

export interface Receipt {
  number: string
  token: string
  issuedAt: string
  totalCents: number
  instructions: string | null
  orderNumber: string
}

export interface ManualContact {
  channel: ManualChannel
  whatsappNumber: string
  telegramUsername: string
}

export const receiptsApi = {
  forOrder: (orderNumber: string) =>
    api.get<{ receipt: Receipt; contact: ManualContact }>(`/me/receipts/${orderNumber}`),

  /** Baja el PDF a la caché y devuelve su ruta local. */
  async downloadToCache(orderNumber: string, receiptNumber: string) {
    const path = `/me/receipts/${orderNumber}/pdf`
    const destination = new File(Paths.cache, `recibo-${receiptNumber}.pdf`)
    if (destination.exists) destination.delete()

    const task = File.createDownloadTask(`${API_BASE}${path}`, destination, {
      headers: await signedHeaders(path),
    })
    const file = await task.downloadAsync()
    if (!file) throw new Error('La descarga del recibo no se completó')
    return file.uri
  },

  /**
   * Abre la hoja de compartir con el PDF adjunto.
   *
   * Aquí sí se adjunta el fichero de verdad: en la web solo se puede mandar un
   * enlace, porque `wa.me` no admite adjuntos.
   */
  async share(orderNumber: string, receiptNumber: string) {
    const uri = await this.downloadToCache(orderNumber, receiptNumber)
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Este dispositivo no permite compartir archivos')
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Recibo ${receiptNumber}`,
    })
  },
}
