import { z } from "zod";

export const myPatientsListSchema = z.object({
  id: z.string(),
  name: z.string(),
  dni: z.string(),
  phoneNumber: z.string(),
  adminButton: z.string(),
});

export type MyPatientsListSchema = z.infer<
  typeof myPatientsListSchema
>;