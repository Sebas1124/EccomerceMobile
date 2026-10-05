const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const date = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' })

/** Los importes viajan en céntimos desde la API. */
export const formatPrice = (cents: number) => currency.format(cents / 100)

export const formatDate = (value: string | Date) => date.format(new Date(value))

/** Céntimos → texto editable en euros ("1234" → "12,34"). */
export const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')

/** Texto en euros → céntimos. Acepta coma o punto; lo que no sea número cuenta como 0. */
export const inputToCents = (value: string) => {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  const euros = Number.parseFloat(normalized)
  return Number.isFinite(euros) ? Math.round(euros * 100) : 0
}

/** "9:59" a partir de los segundos que quedan. */
export const formatCountdown = (seconds: number) => {
  const safe = Math.max(0, seconds)
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}
