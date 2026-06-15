import z from 'zod'

const officesListSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  isActive: z.boolean(),
  adminButton: z.string()
})

export type OfficesListSchema = z.infer <typeof officesListSchema> 