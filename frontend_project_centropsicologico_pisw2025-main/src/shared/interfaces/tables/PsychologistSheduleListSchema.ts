import z from "zod";
const psychologistScheduleListSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  adminButton: z.string(),
});

export type PsychologistScheduleListSchema = z.infer<typeof psychologistScheduleListSchema>;