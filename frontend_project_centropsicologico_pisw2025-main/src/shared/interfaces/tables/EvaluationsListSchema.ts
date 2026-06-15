import z from "zod";
const evaluationsListSchema = z.object({
  id: z.string(),
  name: z.string(),
  testCount: z.number(),
  status: z.boolean(),
  adminButton: z.string(),
});

export type EvaluationsListSchema = z.infer<typeof evaluationsListSchema>;