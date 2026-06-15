import { z } from "zod";

export const userFormSchema = z
  .object({
    firstName: z.string().min(1, "Los nombres son requeridos"),
    lastName: z.string().min(1, "Los apellidos son requeridos"),
    email: z.string().email("Correo electrónico inválido"),
    roles: z
      .array(z.string())
      .min(1, "Debe seleccionar al menos un rol")
      .max(3, "No puede seleccionar más de 3 roles")
      .refine((roles) => {
        // Validación personalizada: no puede ser Interno y Gerente a la vez
        const hasInterno = roles.includes("INTERNAL");
        const hasGerente = roles.includes("ADMIN");
        console.log("roles", hasInterno, hasGerente);
        return !(hasInterno && hasGerente);
      }, "No puede ser Interno y Gerente simultáneamente"),
    cv: z.any(),
    title: z.any(),
    mentalHealthCertificate: z.any(),
    presentationLetter: z.any(),
    certificate: z.any(),
    csp: z
      .string()
      .min(1, "El número de colegiatura (CSP) es requerido")
      .optional()
      .or(z.literal("")),
    dni: z
      .string()
      .min(8, "El DNI debe tener 8 dígitos")
      .max(8, "El DNI debe tener 8 dígitos"),
    psychologistId: z
      .string()
      .min(1, "Debe seleccionar un psicólogo asignado")
      .optional()
      .or(z.literal("")),
    isActive: z.boolean().optional(),
    workSchedule: z.array(
        z.object({
            day: z.string(),
            fromHour: z.string().min(1, "La hora es requerida"),
            fromMinute: z.string(),
            toHour: z.string().min(1, "La hora es requerida"),
            toMinute: z.string(),
            officeId: z.string({
                invalid_type_error: "Debe seleccionar un consultorio", 

            }).min(1, "Debe seleccionar un consultorio"),
        })
    ).optional(),
  })
  .superRefine((data, ctx) => {
    const roles = data.roles || [];

    // Validaciones personalizadas
    // CV requerido para psicólogo o admisión
    if (roles.includes("PSYCHOLOGIST") || roles.includes("ADMISSION")) {
      if (roles.includes("INTERNAL")) return
      // Verifica si hay una url o File adjunto
      if (
        !(
          (typeof data.cv === "string" && data.cv.length > 0) ||
          data.cv instanceof File
        )
      ) {
        ctx.addIssue({
          path: ["cv"],
          code: z.ZodIssueCode.custom,
          message:
            "Debe adjuntar el currículum para psicólogos o personal de admisión",
        });
      }
    }

    // Titulo requerido para psicólogos
    if (roles.includes("PSYCHOLOGIST")) {
      if (roles.includes("INTERNAL")) return
      if (
        !(
          (typeof data.title === "string" && data.title.length > 0) ||
          data.title instanceof File
        )
      ) {
        ctx.addIssue({
          path: ["title"],
          code: z.ZodIssueCode.custom,
          message: "Debe adjuntar el título para psicólogos",
        });
      }
    }

    // Carta de presentación requerido para interno
    if (roles.includes("INTERNAL")) {
      if (
        !(
          (typeof data.presentationLetter === "string" &&
            data.presentationLetter.length > 0) ||
          data.presentationLetter instanceof File
        )
      ) {
        ctx.addIssue({
          path: ["presentationLetter"],
          code: z.ZodIssueCode.custom,
          message: "Debe adjuntar la carta de presentación para internos",
        });
      }
    }

    // Constancia requerida para psicólogo
    if (roles.includes("PSYCHOLOGIST")) {
      if (roles.includes("INTERNAL")) return
      if (
        !(
          (typeof data.certificate === "string" &&
            data.certificate.length > 0) ||
          data.certificate instanceof File
        )
      ) {
        ctx.addIssue({
          path: ["certificate"],
          code: z.ZodIssueCode.custom,
          message: "Debe adjuntar la constancia para psicólogos",
        });
      }
    }

    // Certificado de salud mental requerido para admisión o interno
    if (roles.includes("INTERNAL") || roles.includes("ADMISSION")) {
      if (
        !(
          (typeof data.mentalHealthCertificate === "string" &&
            data.mentalHealthCertificate.length > 0) ||
          data.mentalHealthCertificate instanceof File
        )
      ) {
        ctx.addIssue({
          path: ["mentalHealthCertificate"],
          code: z.ZodIssueCode.custom,
          message:
            "Debe adjuntar el certificado de salud mental para personal de admisión o internos",
        });
      }
    }

    // Horarios para psicólogos
/*     if (roles.includes("PSYCHOLOGIST")) {
        if (!data.workSchedule || data.workSchedule.length === 0) {
            ctx.addIssue({
                path: ["workSchedule"],
                code: z.ZodIssueCode.custom,
                message: "Debe considerar al menos un horario para los psicólogos",
            });
        }
    } */
  });

export type UserFormSchema = z.infer<typeof userFormSchema>;
