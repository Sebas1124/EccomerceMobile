import { Check, Eye, EyeOff } from 'lucide-react-native'
import { useRef, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { useColors } from '@/features/theme'
import { AppText } from '@/shared/components/AppText'
import { haptics } from '@/shared/feedback/haptics'
import { radius, spacing } from '@/shared/theme/tokens'

/** Campos conectados a react-hook-form mediante `control` (sin FormProvider). */
export interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  description?: ReactNode
  disabled?: boolean
}

function FieldShell({
  label,
  description,
  error,
  children,
}: {
  label?: string
  description?: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <View style={styles.field}>
      {label && <AppText variant="label">{label}</AppText>}
      {children}
      {description && !error && <AppText variant="muted">{description}</AppText>}
      {error && (
        <Animated.View entering={FadeIn.duration(150)}>
          <AppText variant="error" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        </Animated.View>
      )}
    </View>
  )
}

function useInputStyle(invalid: boolean, focused: boolean) {
  const colors = useColors()
  return [
    styles.input,
    {
      color: colors.foreground,
      backgroundColor: colors.background,
      borderColor: invalid ? colors.destructive : focused ? colors.primary : colors.input,
    },
  ]
}

export interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  keyboardType?: TextInputProps['keyboardType']
  autoComplete?: TextInputProps['autoComplete']
  autoCapitalize?: TextInputProps['autoCapitalize']
  placeholder?: string
  /** Líneas visibles. Más de una convierte el campo en un área de texto. */
  rows?: number
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  keyboardType,
  autoComplete,
  autoCapitalize = 'sentences',
  placeholder,
  rows,
}: TextFieldProps<T>) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name })
  const [focused, setFocused] = useState(false)
  const colors = useColors()
  const style = useInputStyle(!!fieldState.error, focused)
  return (
    <FieldShell label={label} description={description} error={fieldState.error?.message}>
      <TextInput
        ref={ref}
        value={value ?? ''}
        onChangeText={onChange}
        onBlur={() => {
          setFocused(false)
          onBlur()
        }}
        onFocus={() => setFocused(true)}
        editable={!disabled}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel={label}
        multiline={rows !== undefined && rows > 1}
        numberOfLines={rows}
        style={[
          style,
          // Sin esto el texto de un área multilínea se centra en vertical en Android.
          rows !== undefined && rows > 1 && { minHeight: rows * 22, textAlignVertical: 'top' },
        ]}
      />
    </FieldShell>
  )
}

export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  autoComplete = 'current-password',
}: BaseFieldProps<T> & { autoComplete?: 'current-password' | 'new-password' }) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState,
  } = useController({ control, name })
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const colors = useColors()
  const style = useInputStyle(!!fieldState.error, focused)
  return (
    <FieldShell label={label} description={description} error={fieldState.error?.message}>
      <View>
        <TextInput
          ref={ref}
          value={value ?? ''}
          onChangeText={onChange}
          onBlur={() => {
            setFocused(false)
            onBlur()
          }}
          onFocus={() => setFocused(true)}
          editable={!disabled}
          secureTextEntry={!visible}
          autoComplete={autoComplete === 'new-password' ? 'new-password' : 'current-password'}
          autoCapitalize="none"
          accessibilityLabel={label}
          style={[style, { paddingRight: 48 }]}
        />
        <Pressable
          onPress={() => {
            void haptics.trigger('selection')
            setVisible((v) => !v)
          }}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          hitSlop={8}
          style={styles.eye}
        >
          {visible ? (
            <EyeOff color={colors.mutedForeground} size={20} />
          ) : (
            <Eye color={colors.mutedForeground} size={20} />
          )}
        </Pressable>
      </View>
    </FieldShell>
  )
}

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
}: BaseFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const colors = useColors()
  const checked = !!field.value
  const invalid = !!fieldState.error
  return (
    <FieldShell description={description} error={fieldState.error?.message}>
      <Pressable
        onPress={() => {
          void haptics.trigger('toggle')
          field.onChange(!checked)
        }}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={label}
        style={styles.checkRow}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: invalid ? colors.destructive : checked ? colors.primary : colors.input,
              backgroundColor: checked ? colors.primary : 'transparent',
            },
          ]}
        >
          {checked && (
            <Animated.View entering={ZoomIn.duration(150)}>
              <Check color={colors.primaryForeground} size={14} strokeWidth={3} />
            </Animated.View>
          )}
        </View>
        <AppText style={{ flex: 1 }}>{label}</AppText>
      </Pressable>
    </FieldShell>
  )
}

/** Código numérico de un solo uso con casillas visuales sobre un único TextInput. */
export function OtpField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  length = 6,
}: BaseFieldProps<T> & { length?: number }) {
  const { field, fieldState } = useController({ control, name })
  const inputRef = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)
  const colors = useColors()
  const value: string = field.value ?? ''
  const invalid = !!fieldState.error

  return (
    <FieldShell label={label} description={description} error={fieldState.error?.message}>
      <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel={label} style={styles.otpRow}>
        {Array.from({ length }, (_, i) => {
          const active = focused && i === Math.min(value.length, length - 1)
          return (
            <View
              key={i}
              style={[
                styles.otpBox,
                {
                  borderColor: invalid ? colors.destructive : active ? colors.primary : colors.input,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <AppText variant="subtitle">{value[i] ?? ''}</AppText>
            </View>
          )
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const next = text.replace(/\D/g, '').slice(0, length)
          void haptics.trigger(next.length === length ? 'otp.complete' : 'selection')
          field.onChange(next)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          field.onBlur()
        }}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        style={styles.hiddenInput}
      />
    </FieldShell>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  eye: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  otpBox: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 52,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
})
