/** Textos del apartado legal en el móvil. */
export const legalTexts = {
  title: 'Información legal',
  subtitle: 'Las condiciones de la tienda y qué hacemos con tus datos.',
  empty: 'Todavía no hay documentos publicados.',
  loadError: 'No se pudo cargar la información legal',
  notFound: 'Ese documento no existe o no está publicado.',
  updatedOn: (date: string) => `Actualizado el ${date}`,
  version: (value: number) => `Versión ${value}`,
} as const
