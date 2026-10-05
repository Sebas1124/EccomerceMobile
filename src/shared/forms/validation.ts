import * as yup from 'yup'

/** Reglas compartidas (idénticas a frontend/src/shared/forms/validation.ts y al backend). */
yup.setLocale({
  mixed: { required: 'Campo obligatorio' },
  string: {
    email: 'Introduce un email válido',
    min: ({ min }) => `Debe tener al menos ${min} caracteres`,
    max: ({ max }) => `No puede superar ${max} caracteres`,
  },
})

export const rules = {
  email: () => yup.string().trim().lowercase().email().max(254).required(),
  name: () => yup.string().trim().max(80).required(),
  password: () =>
    yup
      .string()
      .min(10)
      .max(128)
      .matches(/[a-zA-Z]/, 'Incluye al menos una letra')
      .matches(/\d/, 'Incluye al menos un número')
      .required(),
  currentPassword: () => yup.string().max(128).required(),
  confirm: (field: string) =>
    yup
      .string()
      .oneOf([yup.ref(field)], 'Las contraseñas no coinciden')
      .required(),
  otp: () =>
    yup
      .string()
      .matches(/^\d{6}$/, 'El código tiene 6 dígitos')
      .required(),
  accept: (message: string) => yup.boolean().oneOf([true], message).required(message),
}

export { yup }
