import { z } from "zod";

export const suggestionCategories = {
  WORK_ENVIRONMENT: "Clima laboral",
  PROCESSES: "Procesos",
  INFRASTRUCTURE: "Infraestructura",
  OTHER: "Otros",
} as const;

export const suggestionStatuses = {
  NEW: "Nueva",
  READ: "Leída",
  IN_REVIEW: "En revisión",
  ARCHIVED: "Archivada",
} as const;

export type SuggestionCategory = keyof typeof suggestionCategories;
export type SuggestionStatus = keyof typeof suggestionStatuses;
export const SUGGESTION_MESSAGE_LIMIT = 3000;
export const suggestionInputSchema = z.object({
  category: z.enum(["WORK_ENVIRONMENT", "PROCESSES", "INFRASTRUCTURE", "OTHER"], {
    errorMap: () => ({ message: "Selecciona una categoría." }),
  }),
  message: z.string().trim().min(1, "Escribe un mensaje; no puede contener solo espacios.")
    .max(SUGGESTION_MESSAGE_LIMIT, `El mensaje admite hasta ${SUGGESTION_MESSAGE_LIMIT} caracteres.`),
  isAnonymous: z.boolean(),
});
export type SuggestionInput = z.infer<typeof suggestionInputSchema>;

export const suggestionStatusSchema = z.enum(["NEW", "READ", "IN_REVIEW", "ARCHIVED"]);
export const suggestionSchema = suggestionInputSchema.extend({
  id: z.string().min(1),
  status: suggestionStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
  author: z.object({ displayName: z.string().min(1) }).nullable(),
}).transform((suggestion) => ({
  ...suggestion,
  // Never render an author accidentally returned for an anonymous message.
  author: suggestion.isAnonymous ? null : suggestion.author,
}));
export type Suggestion = z.infer<typeof suggestionSchema>;

export const suggestionsPageSchema = z.object({
  items: z.array(suggestionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export type SuggestionsPage = z.infer<typeof suggestionsPageSchema>;
export interface SuggestionFilters {
  page: number;
  category?: SuggestionCategory;
  status?: SuggestionStatus;
}
