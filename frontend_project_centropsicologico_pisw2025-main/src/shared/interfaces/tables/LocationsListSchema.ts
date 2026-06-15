import z from "zod";
const locationsListSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  adminButton: z.string(),
});

export type LocationsListSchema = z.infer<typeof locationsListSchema>;