import z from "zod";

export type EmployeeLeavesListSchema = z.infer<
  z.ZodObject<{
    id: z.ZodString;
    psychologistName: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    isActive: z.ZodBoolean;
    adminButton: z.ZodString;
  }>
>;
