/** Textos del catálogo en el móvil, alineados con los de la web. */
export const catalogTexts = {
  title: 'Catálogo',
  subtitle: 'Todo lo que tenemos a la venta.',
  searchPlaceholder: 'Buscar productos',
  empty: 'No hemos encontrado productos con esos filtros.',
  emptyAction: 'Quitar filtros',
  loadError: 'No se pudo cargar el catálogo',
  results: (total: number) => (total === 1 ? '1 producto' : `${total} productos`),

  allCategories: 'Todo',
  sort: 'Ordenar',
  sortOptions: {
    recientes: 'Novedades',
    'precio-asc': 'Precio ↑',
    'precio-desc': 'Precio ↓',
    nombre: 'Nombre',
  },
  loadMore: 'Ver más',
  loading: 'Cargando...',

  fromPrice: 'Desde',
  soldOut: 'Agotado',
  available: 'Disponible',
  lastUnits: (units: number) =>
    units === 1 ? '¡Última unidad!' : `¡Solo quedan ${units}!`,

  // Ficha
  detailError: 'No se pudo cargar el producto',
  chooseVariant: 'Elige una opción',
  sku: (value: string) => `SKU ${value}`,
  vatIncluded: 'IVA incluido',
  description: 'Descripción',
  noDescription: 'Este producto todavía no tiene descripción.',
  quantity: 'Unidades',
  increase: 'Añadir una unidad',
  decrease: 'Quitar una unidad',
  maxUnits: (units: number) => `Máximo ${units}`,
  addToCart: 'Añadir al carrito',
  added: 'Añadido al carrito',
  addError: 'No se pudo añadir al carrito',
  back: 'Volver',
} as const
