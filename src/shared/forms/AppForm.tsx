import { yupResolver } from '@hookform/resolvers/yup'
import { AlertCircle } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import {
  useForm,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form'
import type { ObjectSchema } from 'yup'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { Button } from '@/shared/components/Button'
import { ApiError } from '@/shared/lib/api-client'
import { radius, spacing } from '@/shared/theme/tokens'
import { CheckboxField, OtpField, PasswordField, TextField, type TextFieldProps } from './fields'

/** Descripción declarativa de un campo (misma forma que en la web). */
export type FieldConfig<T extends FieldValues> = {
  name: FieldPath<T>
  label: string
  description?: ReactNode
  disabled?: boolean
} & (
  | {
      kind: 'text'
      keyboardType?: TextFieldProps<T>['keyboardType']
      autoComplete?: TextFieldProps<T>['autoComplete']
      autoCapitalize?: TextFieldProps<T>['autoCapitalize']
      placeholder?: string
      /** Más de una línea lo convierte en área de texto. */
      rows?: number
    }
  | { kind: 'password'; autoComplete?: 'current-password' | 'new-password' }
  | { kind: 'checkbox' }
  | { kind: 'otp'; length?: number }
)

export interface AppFormProps<T extends FieldValues> {
  schema: ObjectSchema<T>
  defaultValues: DefaultValues<T>
  fields?: FieldConfig<T>[]
  children?: (form: UseFormReturn<T>) => ReactNode
  onSubmit: (values: T, form: UseFormReturn<T>) => Promise<void> | void
  submitLabel: string
  footer?: ReactNode
}

function applyApiError<T extends FieldValues>(form: UseFormReturn<T>, error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
      for (const issue of error.details as { path?: (string | number)[]; message: string }[]) {
        const path = issue.path?.join('.')
        if (path) form.setError(path as FieldPath<T>, { message: issue.message })
      }
      return
    }
    form.setError('root', { message: error.message })
    return
  }
  if (__DEV__) console.warn('[AppForm] Error no controlado', error)
  form.setError('root', { message: 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.' })
}

export function renderField<T extends FieldValues>(form: UseFormReturn<T>, config: FieldConfig<T>) {
  const common = {
    control: form.control,
    name: config.name,
    label: config.label,
    description: config.description,
    disabled: config.disabled || form.formState.isSubmitting,
  }
  switch (config.kind) {
    case 'text':
      return (
        <TextField
          key={config.name}
          {...common}
          keyboardType={config.keyboardType}
          autoComplete={config.autoComplete}
          autoCapitalize={config.autoCapitalize}
          placeholder={config.placeholder}
          rows={config.rows}
        />
      )
    case 'password':
      return <PasswordField key={config.name} {...common} autoComplete={config.autoComplete} />
    case 'checkbox':
      return <CheckboxField key={config.name} {...common} />
    case 'otp':
      return <OtpField key={config.name} {...common} length={config.length} />
  }
}

/** Formulario reutilizable: react-hook-form + yup, envío con carga y errores de API mapeados. */
export function AppForm<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  children,
  onSubmit,
  submitLabel,
  footer,
}: AppFormProps<T>) {
  const colors = useColors()
  const form = useForm<T>({
    resolver: yupResolver(schema) as unknown as Resolver<T>,
    defaultValues,
    mode: 'onTouched',
  })
  const rootError = form.formState.errors.root?.message

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values, form)
    } catch (error) {
      applyApiError(form, error)
    }
  })

  return (
    <View style={styles.form}>
      {rootError && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          accessibilityRole="alert"
          style={[
            styles.alert,
            { borderColor: colors.destructive, backgroundColor: `${colors.destructive}14` },
          ]}
        >
          <AlertCircle color={colors.destructive} size={18} />
          <AppText variant="error" style={{ flex: 1, fontSize: 14 }}>
            {rootError}
          </AppText>
        </Animated.View>
      )}
      {fields?.map((config) => renderField(form, config))}
      {children?.(form)}
      <Button label={submitLabel} loading={form.formState.isSubmitting} onPress={() => void submit()} />
      {footer}
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
})
