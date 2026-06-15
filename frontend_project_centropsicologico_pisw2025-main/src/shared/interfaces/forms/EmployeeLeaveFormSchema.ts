import { z } from "zod";

export const employeeLeaveFormSchema = z
  .object({
    userId: z.string().min(1, "Debe seleccionar un psicólogo"),
    startDate: z.string().min(1, "Debe seleccionar una fecha de inicio"),
    endDate: z.string().min(1, "Debe seleccionar una fecha de finalización"),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message:
        "La fecha de inicio debe ser anterior o igual a la fecha de finalización",
      path: ["endDate"],
    }
  );

export type EmployeeLeaveFormSchema = z.infer<typeof employeeLeaveFormSchema>;
