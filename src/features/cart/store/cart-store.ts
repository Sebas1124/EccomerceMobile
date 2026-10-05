import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { cartApi } from '../api/cart-api'
import type { CartLine, CartSummary, GuestLine } from '../types'

const STORAGE_KEY = 'cart-guest'
const MAX_QTY = 99

const emptyCart: CartSummary = {
  id: null,
  lines: [],
  itemCount: 0,
  totalCents: 0,
  subtotalCents: 0,
  discountCents: 0,
  taxes: [],
  hasIssues: false,
}

/** El carrito de invitado vive en el dispositivo hasta que se inicia sesión. */
async function readGuest(): Promise<GuestLine[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GuestLine[]) : []
  } catch {
    return []
  }
}

async function writeGuest(lines: GuestLine[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  } catch {
    // Almacenamiento lleno o sin permisos: el carrito dura lo que la sesión.
  }
}

/** El carrito de invitado se calcula aquí con los datos guardados. */
function summarizeGuest(lines: GuestLine[]): CartSummary {
  const taxes = new Map<number, { baseCents: number; taxCents: number }>()
  let totalCents = 0
  let itemCount = 0

  const mapped: CartLine[] = lines.map((line) => {
    const lineTotalCents = line.snapshot.priceCents * line.qty
    totalCents += lineTotalCents
    itemCount += line.qty

    const rate = line.snapshot.vatRate
    const base = Math.round(lineTotalCents / (1 + rate / 100))
    const entry = taxes.get(rate) ?? { baseCents: 0, taxCents: 0 }
    entry.baseCents += base
    entry.taxCents += lineTotalCents - base
    taxes.set(rate, entry)

    return {
      // En invitado la línea se identifica por su variante.
      id: line.variantId,
      qty: line.qty,
      variant: {
        id: line.variantId,
        sku: line.snapshot.sku,
        name: line.snapshot.variantName,
        priceCents: line.snapshot.priceCents,
        // El invitado guarda el precio ya rebajado; el desglose del descuento
        // aparece al identificarse, con el carrito del servidor.
        finalPriceCents: line.snapshot.priceCents,
        compareAtCents: null,
        available: MAX_QTY,
        isActive: true,
      },
      product: {
        id: line.snapshot.productSlug,
        name: line.snapshot.productName,
        slug: line.snapshot.productSlug,
        vatRate: rate,
        imageUrl: line.snapshot.imageUrl,
        isActive: true,
      },
      lineTotalCents,
      discountCents: 0,
      promotion: null,
      issue: null,
    }
  })

  return {
    id: null,
    lines: mapped,
    itemCount,
    totalCents,
    subtotalCents: [...taxes.values()].reduce((sum, entry) => sum + entry.baseCents, 0),
    discountCents: 0,
    taxes: [...taxes.entries()].map(([rate, entry]) => ({ rate, ...entry })).sort((a, b) => b.rate - a.rate),
    hasIssues: false,
  }
}

interface CartState {
  cart: CartSummary
  /** true mientras hay una operación en vuelo (para deshabilitar botones). */
  busy: boolean
  /** Sin sesión el carrito vive en el dispositivo. */
  guest: boolean
  load: (authenticated: boolean) => Promise<void>
  add: (line: GuestLine) => Promise<void>
  setQty: (lineId: string, qty: number) => Promise<void>
  remove: (lineId: string) => Promise<void>
  clear: () => Promise<void>
  /** Tras iniciar sesión: sube lo que hubiera en el dispositivo y lo vacía. */
  mergeGuest: () => Promise<number>
}

/**
 * Carrito compartido. Con sesión manda el servidor (el mismo carrito que en la
 * web); sin sesión se guarda aquí y se fusiona al iniciar sesión.
 */
export const useCartStore = create<CartState>((set, get) => ({
  cart: emptyCart,
  busy: false,
  guest: true,

  load: async (authenticated) => {
    if (!authenticated) {
      set({ guest: true, cart: summarizeGuest(await readGuest()) })
      return
    }
    set({ guest: false, busy: true })
    try {
      const { cart } = await cartApi.get()
      set({ cart })
    } finally {
      set({ busy: false })
    }
  },

  add: async (line) => {
    if (get().guest) {
      const lines = await readGuest()
      const existing = lines.find((item) => item.variantId === line.variantId)
      if (existing) existing.qty = Math.min(existing.qty + line.qty, MAX_QTY)
      else lines.push(line)
      await writeGuest(lines)
      set({ cart: summarizeGuest(lines) })
      return
    }

    set({ busy: true })
    try {
      const { cart } = await cartApi.addItem(line.variantId, line.qty)
      set({ cart })
    } finally {
      set({ busy: false })
    }
  },

  setQty: async (lineId, qty) => {
    if (qty <= 0) return get().remove(lineId)

    if (get().guest) {
      const lines = await readGuest()
      const line = lines.find((item) => item.variantId === lineId)
      if (line) line.qty = Math.min(qty, MAX_QTY)
      await writeGuest(lines)
      set({ cart: summarizeGuest(lines) })
      return
    }

    set({ busy: true })
    try {
      const { cart } = await cartApi.setQty(lineId, qty)
      set({ cart })
    } finally {
      set({ busy: false })
    }
  },

  remove: async (lineId) => {
    if (get().guest) {
      const lines = (await readGuest()).filter((item) => item.variantId !== lineId)
      await writeGuest(lines)
      set({ cart: summarizeGuest(lines) })
      return
    }

    set({ busy: true })
    try {
      const { cart } = await cartApi.removeItem(lineId)
      set({ cart })
    } finally {
      set({ busy: false })
    }
  },

  clear: async () => {
    if (get().guest) {
      await writeGuest([])
      set({ cart: emptyCart })
      return
    }

    set({ busy: true })
    try {
      const { cart } = await cartApi.clear()
      set({ cart })
    } finally {
      set({ busy: false })
    }
  },

  mergeGuest: async () => {
    const lines = await readGuest()
    set({ guest: false })
    if (lines.length === 0) {
      await get().load(true)
      return 0
    }

    set({ busy: true })
    try {
      const { cart } = await cartApi.merge(
        lines.map((line) => ({ variantId: line.variantId, qty: line.qty })),
      )
      // Solo se vacía el local cuando el servidor ha aceptado la fusión.
      await writeGuest([])
      set({ cart })
      return lines.length
    } finally {
      set({ busy: false })
    }
  },
}))
