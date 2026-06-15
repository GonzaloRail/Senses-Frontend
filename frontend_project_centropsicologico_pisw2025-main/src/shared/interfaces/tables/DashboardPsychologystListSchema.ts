import { z } from "zod";

export const dashboardPsychologystListSchema = z.object({
  id: z.string(),
  name: z.string(),
  patientNumber: z.number(),
});

export type DashboardPsychologystListSchema = z.infer<
  typeof dashboardPsychologystListSchema
>;