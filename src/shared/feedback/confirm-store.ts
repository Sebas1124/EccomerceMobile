import type { LucideIcon } from 'lucide-react-native'
import { create } from 'zustand'
import { haptics } from './haptics'

export type ConfirmTone = 'danger' | 'warning' | 'default'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: LucideIcon
  /** Se ejecuta al confirmar con el diálogo abierto y en estado de carga. */
  action?: () => Promise<unknown>
}

interface ConfirmState {
  pending: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  busy: boolean
  open: (options: ConfirmOptions) => Promise<boolean>
  settle: (confirmed: boolean) => Promise<void>
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  pending: null,
  busy: false,
  open: (options) =>
    new Promise<boolean>((resolve) => {
      get().pending?.resolve(false)
      void haptics.trigger(options.tone === 'danger' ? 'warning' : 'confirm.open')
      set({ pending: { ...options, resolve }, busy: false })
    }),
  settle: async (confirmed) => {
    const pending = get().pending
    if (!pending || get().busy) return
    if (confirmed) void haptics.trigger(pending.tone === 'danger' ? 'destructive' : 'confirm.accept')
    if (confirmed && pending.action) {
      set({ busy: true })
      try {
        await pending.action()
      } catch (error) {
        set({ pending: null, busy: false })
        pending.resolve(false)
        throw error
      }
    }
    set({ pending: null, busy: false })
    pending.resolve(confirmed)
  },
}))

/** Confirmación obligatoria antes de eliminar o de acciones irreversibles/con efectos. */
export const confirm = (options: ConfirmOptions) => useConfirmStore.getState().open(options)
