import { z } from "zod";

export const appointmentFormSchema = z
  .object({
    patientId: z.string().min(1, "Debe seleccionar un paciente"),
    date: z.string().min(1, "La fecha es requerida"),
    startTime: z.string().min(1, "La hora de inicio es requerida"),
    endTime: z.string().min(1, "La hora de fin es requerida"),
    psychologistId: z.string().min(1, "Debe seleccionar un psicólogo"),
    officeId: z.string().min(1, "No hay coincidencias, verifique los horarios del psicólogo seleccionado"),
    reason: z.string().min(1, "El motivo es requerido"),
    typeId: z.string().min(1, "El tipo de cita es requerido"),
  })
  .refine(
    (data) => {
      // Validar que la hora de fin sea posterior a la hora de inicio
      if (data.startTime && data.endTime) {
        const start = new Date(`2000-01-01T${data.startTime}`);
        const end = new Date(`2000-01-01T${data.endTime}`);
        return end > start;
      }
      return true;
    },
    {
      message: "La hora de fin debe ser posterior a la hora de inicio",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      if (data.date) {
        const selectedDate = new Date(data.date + "T00:00:00"); // Fuerza zona horaria local
        const today = new Date();

        // Comparar solo las fechas (año, mes, día)
        const selectedDateOnly = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        const todayOnly = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        console.log({ selectedDateOnly, todayOnly });
        return selectedDateOnly >= todayOnly; // >= para permitir hoy
      }
      return true;
    },
    {
      message: "La fecha no puede ser anterior a hoy",
      path: ["date"],
    }
  );

export type AppointmentFormSchema = z.infer<typeof appointmentFormSchema>;
