import { api } from '@/shared/lib/api-client'

/** A dónde envía la tienda; decide qué deja elegir el formulario. */
export interface ShippingZones {
  baseCountry: string
  baseCity: string
  /** Con `false`, la ciudad se queda en la ciudad base. */
  otherCities: boolean
  /** Con `false`, el país se queda en el país base. */
  otherCountries: boolean
  countries: { code: string; surchargeCents: number }[]
}

export interface CityHit {
  city: string
  province?: string | null
  postalCode?: string | null
  country: string
}

export interface StreetHit extends CityHit {
  street: string
  label: string
}

/** Crédito que el callejero obliga a enseñar junto a sus resultados. */
export interface AddressAttribution {
  text: string
  href: string
}

export interface Province {
  code: string
  name: string
}

const qs = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

/**
 * Ayuda para rellenar una dirección. Es pública: el checkout se usa sin sesión.
 *
 * Mismos endpoints que en la web, para que una ciudad escrita en el móvil y
 * otra escrita en el navegador se guarden exactamente igual.
 */
export const addressApi = {
  zones: () => api.get<{ zones: ShippingZones }>('/address/zones', { auth: false }),

  provinces: () => api.get<{ items: Province[] }>('/address/provinces', { auth: false }),

  cities: (q: string, country: string) =>
    api.get<{ items: CityHit[]; attribution: AddressAttribution | null }>(
      `/address/cities?${qs({ q, country })}`,
      { auth: false },
    ),

  streets: (q: string, city: string, country: string) =>
    api.get<{ items: StreetHit[]; attribution: AddressAttribution | null }>(
      `/address/streets?${qs({ q, city, country })}`,
      { auth: false },
    ),

  /** Provincia que corresponde a un código postal español. */
  postalCode: (postalCode: string) =>
    api.get<{ province: Province | null }>(`/address/postal-code?${qs({ postalCode })}`, {
      auth: false,
    }),
}
