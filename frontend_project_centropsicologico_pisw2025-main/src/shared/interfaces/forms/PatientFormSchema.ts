import { z } from "zod";

export const patientFormSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  dni: z.string().min(8, "El DNI debe tener 8 caracteres"),
  gender: z.string().min(1, "El género es obligatorio"),
  birthdate: z
    .string()
    .min(1, "La fecha de nacimiento es obligatoria")
    .refine(
      (date) => {
        if (!date) return false;
        const [year, month, day] = date.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d <= today;
      },
      { message: "La fecha de nacimiento no puede ser futura" }
    ),
  educationLevel: z.string().min(1, "El nivel educativo es obligatorio"),
  birthPlace: z.string().min(1, "El lugar de nacimiento es obligatorio"),
  occupation: z.string().min(1, "La ocupación es obligatoria"),
  maritalStatus: z.string().min(1, "El estado civil es obligatorio"),
  religion: z.string().optional(),
  occupationLocation: z.string().min(1, "El lugar de trabajo es obligatorio"),
  phoneNumber: z.string().min(6, "El teléfono es obligatorio"),
  isActive: z.boolean().optional(),
  address: z.string().min(1, "La dirección es obligatoria"),

  parentFullName: z.coerce.string().optional(),
  parentDni: z.coerce.string().optional(),
  parentPhoneNumber: z.coerce.string().optional(),

  districtId: z.string().min(1, "El distrito es obligatorio"),
  provinceId: z.string().min(1, "La provincia es obligatoria"),
  regionId: z.string().min(1, "El departamento es obligatorio"),

  livesWith: z.string().optional(),
  numChildren: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  mainReason: z.string().optional(),
  howLong: z.string().optional(),
  previousTherapy: z.string().optional(),
  psychiatricMedication: z.string().optional(),
  urgencyLevel: z.string().optional(),
  preferredModality: z.string().optional(),
  preferredSchedule: z.string().optional(),
  requiredSpecialty: z.string().optional(),
  preferredContact: z.string().optional(),
  howFoundUs: z.string().optional(),
  whoReferred: z.string().optional(),
  whatAttractedAttention: z.string().optional(),
  comparedOtherCenters: z.string().optional(),
  acceptPromotions: z.string().optional(),
  employmentStatus: z.string().optional(),
  workSector: z.string().optional(),
  workMode: z.string().optional(),
  incomeRange: z.string().optional(),
  paymentMethods: z.string().optional(),
  acceptDataPolicy: z.boolean().optional(),
  acceptCommunications: z.boolean().optional(),
})
  .superRefine((data, ctx) => {
    if (data.parentDni && data.dni === data.parentDni) {
      ctx.addIssue({
        path: ["parentDni"],
        message: "El DNI del padre no puede ser igual al DNI del paciente",
        code: z.ZodIssueCode.custom,
      });
    }
  });

export type PatientFormSchema = z.infer<typeof patientFormSchema>;
