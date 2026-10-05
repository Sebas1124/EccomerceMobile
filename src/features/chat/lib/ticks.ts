export type TickState = 'sending' | 'delivered' | 'read'

/**
 * Decide el acuse de un mensaje propio comparando contra cuándo leyó el otro
 * lado: si leyó a las 12:05, todo lo anterior está leído.
 */
export function tickFor(createdAt: string, otherSideReadAt: string | null): TickState {
  if (!otherSideReadAt) return 'delivered'
  return new Date(otherSideReadAt) >= new Date(createdAt) ? 'read' : 'delivered'
}
