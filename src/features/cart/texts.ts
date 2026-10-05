/** Textos del carrito en el móvil. */
export const cartTexts = {
  title: 'Carrito',
  empty: 'Tu carrito está vacío.',
  emptyAction: 'Ver el catálogo',
  loadError: 'No se pudo cargar el carrito',
  items: (count: number) => (count === 1 ? '1 artículo' : `${count} artículos`),

  unit: 'Precio unidad',
  increase: 'Añadir una unidad',
  decrease: 'Quitar una unidad',
  removeLine: 'Quitar del carrito',
  removed: 'Artículo quitado',
  clear: 'Vaciar carrito',
  clearTitle: 'Vaciar el carrito',
  clearConfirm: 'Se quitarán todos los artículos.',
  cleared: 'Carrito vacío',

  issues: {
    unavailable: 'Ya no está a la venta',
    not_enough_stock: 'No hay unidades suficientes',
  },

  subtotal: 'Base imponible',
  tax: (rate: number) => `IVA (${rate}%)`,
  discounts: 'Descuentos',
  shipping: 'Gastos de envío',
  shippingAtCheckout: 'Se calculan al finalizar',
  total: 'Total',
  taxIncluded: 'Impuestos incluidos',

  checkout: 'Finalizar compra',
  continueShopping: 'Seguir comprando',
  needLogin: 'Inicia sesión para finalizar la compra',
  login: 'Iniciar sesión',
  guestNotice: 'Tu carrito se guardará al iniciar sesión.',
  merged: (count: number) =>
    count === 1 ? 'Hemos añadido 1 artículo de tu carrito' : `Hemos añadido ${count} artículos de tu carrito`,

  addToCart: 'Añadir al carrito',
  added: 'Añadido al carrito',
  addedUnits: (units: number) => `${units} unidades añadidas al carrito`,
  addError: 'No se pudo añadir al carrito',
} as const
