import { z } from "zod";

export const itemFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  quantity: z.coerce.number() // Cambiamos a number con coerción automática
    .min(0, "La cantidad debe ser un número positivo")
    .max(9999, "La cantidad no puede ser mayor a 9999")
    .int("Solo se permiten números enteros"),
  description: z
    .string()
    .max(255, "La descripción no puede exceder los 255 caracteres")
    .optional(),
  isActive: z.boolean().optional(),
});

export type ItemFormSchema = z.infer<typeof itemFormSchema>;
