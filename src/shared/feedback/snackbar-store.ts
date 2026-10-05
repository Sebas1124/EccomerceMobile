import { create } from 'zustand'

export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface SnackbarItem {
  id: number
  variant: SnackbarVariant
  title: string
  description?: string
  action?: { label: string; onPress: () => void }
  duration: number
}

interface SnackbarState {
  items: SnackbarItem[]
  show: (item: Omit<SnackbarItem, 'id'> & { id?: number }) => number
  dismiss: (id: number) => void
}

const MAX_VISIBLE = 3
let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export const useSnackbarStore = create<SnackbarState>((set, get) => ({
  items: [],
  show: ({ id, ...item }) => {
    const itemId = id ?? nextId++
    clearTimeout(timers.get(itemId))
    set((s) => {
      const exists = s.items.some((i) => i.id === itemId)
      const items = exists
        ? s.items.map((i) => (i.id === itemId ? { ...item, id: itemId } : i))
        : [...s.items, { ...item, id: itemId }].slice(-MAX_VISIBLE)
      return { items }
    })
    if (Number.isFinite(item.duration)) {
      timers.set(
        itemId,
        setTimeout(() => get().dismiss(itemId), item.duration),
      )
    }
    return itemId
  },
  dismiss: (id) => {
    clearTimeout(timers.get(id))
    timers.delete(id)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },
}))
