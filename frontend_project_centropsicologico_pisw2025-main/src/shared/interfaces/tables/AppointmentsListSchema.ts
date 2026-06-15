import z from "zod";
import type { AppointmentStatus } from "../models/Appointment";

export type AppointmentsListSchema = z.infer<
  z.ZodObject<{
    id: z.ZodString;
    patientName: z.ZodString;
    date: z.ZodDate;
    startDateTime: z.ZodDate;
    psychologistName: z.ZodString;
    status: z.ZodType<AppointmentStatus>;
    adminButton: z.ZodString;
  }>
>;
