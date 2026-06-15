import { z } from "zod";

export const testFormSchema = z.object({
  testName: z.string().min(1, "El nombre es requerido"),
  testDescription: z
    .string()
    .max(255, "La descripción no puede exceder los 255 caracteres")
    .optional(),
  testFile: z.any().optional(),
});

export type TestFormSchema = z.infer<typeof testFormSchema>;