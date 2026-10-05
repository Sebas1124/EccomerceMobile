import { create } from 'zustand'

interface DrawerState {
  open: boolean
  show: () => void
  hide: () => void
}

/**
 * Estado del cajón de navegación. Vive en un store, no en un provider: el
 * botón que lo abre está en la cabecera y el panel se monta en el layout raíz,
 * así que no comparten árbol.
 */
export const useDrawerStore = create<DrawerState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}))
