import { z } from "zod";

const myAppointmentsListSchema = z.object({
  id: z.string(),
  patient: z.string(),
  startDateTime: z.date(),
  date: z.date(),
  status: z.string(),
  adminButton: z.string(),
})

export type MyAppointmentsListSchema = z.infer<typeof myAppointmentsListSchema>;