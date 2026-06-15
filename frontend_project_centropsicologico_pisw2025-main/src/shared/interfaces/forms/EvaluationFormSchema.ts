import { z } from "zod";

export const evaluationFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z
    .string()
    .max(255, "La descripción no puede exceder los 255 caracteres")
    .optional(),
  isActive: z.boolean().optional(),
  openNewSection: z.boolean().optional(),
  psychologicalTests: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "El nombre del test es requerido"),
      description: z.string().optional(),
      filename: z.string(),
      fileurl: z.string().optional(),
      testFile: z.instanceof(File).optional(),
      isNew: z.boolean().optional(),
      templateContent: z.string().optional(),
    })
  ),
});

export type EvaluationFormSchema = z.infer<typeof evaluationFormSchema>;
