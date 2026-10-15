/** Textos centralizados (solo español), alineados con los de la web. */
export const texts = {
  common: {
    comingSoon: 'Próximamente',
    comingSoonDescription: 'Esta sección se implementará en una próxima fase.',
  },
  theme: {
    toLight: 'Cambiar a tema claro',
    toDark: 'Cambiar a tema oscuro',
  },
  tabs: {
    home: 'Inicio',
    catalog: 'Catálogo',
    cart: 'Carrito',
    account: 'Cuenta',
  },
  home: {
    heroTitle: (shop: string) => `Bienvenido a ${shop}`,
    heroSubtitle: 'Echa un vistazo a lo último que hemos añadido.',
    search: 'Buscar en el catálogo',
    categories: 'Categorías',
    featured: 'Lo último',
    seeAll: 'Ver todo el catálogo',
    empty: 'Todavía no hay productos publicados.',
  },
} as const
