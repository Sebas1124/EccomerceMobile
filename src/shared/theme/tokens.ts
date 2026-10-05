/**
 * Tokens de color equivalentes a las variables CSS de la web.
 * `primary` se sobrescribe en runtime con el color de marca del superadmin.
 */
export type ThemeName = 'dark' | 'light'

export interface Palette {
  background: string
  foreground: string
  card: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  primary: string
  primaryForeground: string
  destructive: string
  success: string
  warning: string
  info: string
  overlay: string
}

export const palettes: Record<ThemeName, Palette> = {
  dark: {
    background: '#0a0a0a',
    foreground: '#fafafa',
    card: '#171717',
    muted: '#262626',
    mutedForeground: '#a1a1a1',
    border: '#2e2e2e',
    input: '#333333',
    primary: '#8b5cf6',
    primaryForeground: '#fafafa',
    destructive: '#ff6467',
    success: '#4ade80',
    warning: '#fbbf24',
    info: '#60a5fa',
    overlay: 'rgba(0,0,0,0.6)',
  },
  light: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    card: '#ffffff',
    muted: '#f5f5f5',
    mutedForeground: '#737373',
    border: '#e5e5e5',
    input: '#e5e5e5',
    primary: '#7c3aed',
    primaryForeground: '#fafafa',
    destructive: '#e7000b',
    success: '#16a34a',
    warning: '#d97706',
    info: '#2563eb',
    overlay: 'rgba(0,0,0,0.4)',
  },
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const
export const radius = { sm: 6, md: 8, lg: 10, xl: 14, full: 999 } as const

/** Convierte "h s% l%" (formato del branding) a hex. */
/**
 * Normaliza un color de marca a hexadecimal. El branding se guarda en hex,
 * pero se acepta el formato antiguo "h s% l%" de instancias ya configuradas.
 */
export function toHex(value: string): string | undefined {
  return value.startsWith('#') ? value : hslToHex(value)
}

export function hslToHex(hsl: string): string | undefined {
  const match = hsl.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/)
  if (!match) return undefined
  const [h, s, l] = [Number(match[1]), Number(match[2]) / 100, Number(match[3]) / 100]
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return `#${[f(0), f(8), f(4)]
    .map((x) =>
      Math.round(x * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}
