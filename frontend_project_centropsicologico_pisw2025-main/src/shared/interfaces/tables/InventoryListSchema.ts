import { z } from "zod";

const inventoryListSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  isActive: z.boolean(),
  adminButton: z.string(),
})

export type InventoryListSchema = z.infer<typeof inventoryListSchema>;