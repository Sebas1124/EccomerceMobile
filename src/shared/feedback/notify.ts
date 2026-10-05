import { ApiError } from '@/shared/lib/api-client'
import { haptics } from './haptics'
import { useSnackbarStore, type SnackbarItem, type SnackbarVariant } from './snackbar-store'

export interface NotifyOptions {
  description?: string
  action?: SnackbarItem['action']
  duration?: number
  id?: number
}

/**
 * Duración por variante. Los avisos que requieren leer (error, aviso) duran más.
 * Se pueden ajustar por instancia con `configureSnackbars`.
 */
const durations: Record<SnackbarVariant, number> = {
  success: 6000,
  info: 7000,
  warning: 9000,
  error: 11000,
  loading: Infinity,
}

export function configureSnackbars(overrides: Partial<Record<SnackbarVariant, number>>) {
  Object.assign(durations, overrides)
}

const show = (variant: SnackbarVariant, title: string, options: NotifyOptions = {}) => {
  // Cada tipo de feedback se siente distinto en los dedos.
  if (variant === 'success' || variant === 'warning' || variant === 'error') void haptics.trigger(variant)
  return useSnackbarStore.getState().show({
    variant,
    title,
    description: options.description,
    action: options.action,
    duration: options.duration ?? durations[variant],
    id: options.id,
  })
}

export function errorMessage(error: unknown, fallback = 'No se pudo completar la operación.') {
  return error instanceof ApiError ? error.message : fallback
}

/** Snackbars de feedback (misma API que la web). Obligatorio tras cada acción del usuario. */
export const notify = {
  success: (title: string, options?: NotifyOptions) => show('success', title, options),
  error: (title: string, options?: NotifyOptions) => show('error', title, options),
  warning: (title: string, options?: NotifyOptions) => show('warning', title, options),
  info: (title: string, options?: NotifyOptions) => show('info', title, options),
  loading: (title: string, options?: NotifyOptions) => show('loading', title, options),
  dismiss: (id: number) => useSnackbarStore.getState().dismiss(id),
  fromError: (error: unknown, title = 'Algo ha salido mal') =>
    show('error', title, { description: errorMessage(error) }),
  async promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string | ((value: T) => string); error?: string },
  ): Promise<T> {
    const id = show('loading', messages.loading)
    try {
      const value = await promise
      show('success', typeof messages.success === 'function' ? messages.success(value) : messages.success, {
        id,
      })
      return value
    } catch (error) {
      show('error', messages.error ?? 'Algo ha salido mal', { id, description: errorMessage(error) })
      throw error
    }
  },
}
