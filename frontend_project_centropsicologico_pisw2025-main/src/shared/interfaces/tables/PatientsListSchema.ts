import { z } from "zod";

export const patientsListSchema = z.object({
  id: z.string(),
  name: z.string(),
  dni: z.string(),
  phoneNumber: z.string(),
  adminButton: z.string(),
});

export type PatientsListSchema = z.infer<
  typeof patientsListSchema
>;