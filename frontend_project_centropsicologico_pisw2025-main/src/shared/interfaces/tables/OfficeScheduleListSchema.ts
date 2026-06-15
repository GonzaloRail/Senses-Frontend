import z from "zod";
const officeScheduleListSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  type: z.string(),
  adminButton: z.string(),
});

export type OfficeScheduleListSchema = z.infer<typeof officeScheduleListSchema>;