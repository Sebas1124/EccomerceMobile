/** Textos de la ayuda para rellenar direcciones (solo español). */
export const addressTexts = {
  city: {
    label: 'Ciudad',
    placeholder: 'Elige tu ciudad',
    search: 'Buscar ciudad',
    searching: 'Buscando…',
    noResults: 'No encontramos esa ciudad.',
    typeToSearch: 'Escribe para buscar tu ciudad.',
    useTyped: (value: string) => `Usar «${value}»`,
    onlyBase: (city: string) => `Por ahora solo repartimos en ${city}.`,
  },
  country: {
    label: 'País',
    search: 'Buscar país',
    onlyBase: 'Esta tienda solo envía dentro de su país.',
    surcharge: (amount: string) => `Enviar aquí suma ${amount} al envío.`,
  },
  street: {
    label: 'Dirección',
    help: 'Escribe la calle y elígela; después añade el número y el piso.',
    helpNoLookup: 'Calle, número y piso.',
  },
  postalCode: {
    filled: (province: string) => `Provincia rellenada: ${province}.`,
  },
  close: 'Cerrar',
  /**
   * El crédito lo manda el servidor —lo impone cada callejero—, así que aquí
   * solo vive la etiqueta accesible del enlace a su licencia.
   */
  attribution: 'Ver la licencia de los datos de direcciones',
} as const
