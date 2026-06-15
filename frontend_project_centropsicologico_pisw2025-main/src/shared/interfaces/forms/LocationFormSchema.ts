import { z } from "zod";

export const locationFormSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    address: z.string().min(1, "La dirección es requerida"),
    regionId: z.string().min(1, "Debe seleccionar una región"),
    provinceId: z.string().min(1, "Debe seleccionar una provincia"),
    districtId: z.string().min(1, "Debe seleccionar un distrito"),
    isActive: z.boolean().optional(),
})

export type LocationFormSchema = z.infer<typeof locationFormSchema>;