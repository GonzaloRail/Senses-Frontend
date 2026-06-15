import z from 'zod'

export const officeFormSchema = z.object({
  name: z.string().min(1, "Ingrese el nombre"),
  capacity: z.coerce.number()
    .min(1, "Capacidad debe ser mayor o igual a 1")
    .max(100, "Ingrese valores válidos")
    .int("Ingrese valores válidos"),
  locationId: z.string().min(1, "Debe seleccionar una sede"),
  type: z.string().min(1, "Debe ingresar el tipo"),
  isActive: z.boolean().optional(),
})

export type OfficeFormSchema = z.infer <typeof officeFormSchema>