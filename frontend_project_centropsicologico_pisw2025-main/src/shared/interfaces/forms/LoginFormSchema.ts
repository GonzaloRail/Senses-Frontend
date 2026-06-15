import { z } from 'zod'

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Formato de correo inválido"),

  password: z
    .string()
    .min(1, "La contraseña es obligatoria"),
})

export type LoginFormSchema = z.infer<typeof loginFormSchema>