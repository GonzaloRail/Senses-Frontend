import { z } from "zod";

export const clinicalHistoriesListSchema = z.object({
  id: z.string(),
  displayInt: z.string(),
  patientName: z.string(),
  psichologystName: z.string(),
  adminButton: z.string(),
});

export type ClinicalHistoriesListSchema = z.infer<
  typeof clinicalHistoriesListSchema
>;
