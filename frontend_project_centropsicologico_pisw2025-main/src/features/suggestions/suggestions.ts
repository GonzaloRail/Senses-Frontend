import { z } from "zod";

export const recordTypes = {
  SUGGESTION: "Sugerencia", OBSERVATION: "Observación", RECOGNITION: "Reconocimiento",
  IMPROVEMENT_NEEDED: "Situación que requiere mejora",
} as const;
export const areas = {
  PSYCHOLOGICAL_CARE: "Atención psicológica", ADMISSION: "Admisión", HUMAN_RESOURCES: "Recursos Humanos",
  INFRASTRUCTURE: "Infraestructura", ORGANIZATION: "Organización",
  PSYCHOLOGISTS_IN_TRAINING: "Psicólogos(as) en formación", OTHER: "Otro",
} as const;
export const respondentTypes = {
  PATIENT: "Paciente", FAMILY: "Familiar o acompañante", PSYCHOLOGIST: "Psicólogo(a)",
  PSYCHOLOGIST_IN_TRAINING: "Psicólogo(a) en formación", ADMINISTRATIVE_STAFF: "Personal administrativo", OTHER: "Otro",
} as const;
export const importanceOptions = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" } as const;
export const priorities = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" } as const;
export const statuses = {
  NEW: "Nuevo", IN_ANALYSIS: "En análisis", ACTION_PLANNED: "Con plan de acción",
  FOLLOW_UP: "En seguimiento", CLOSED: "Cerrado",
} as const;
export const closureReasons = {
  RESOLVED: "Resuelta", PARTIALLY_RESOLVED: "Parcialmente resuelta",
  UNRESOLVED: "No resuelta", ADMINISTRATIVE: "Cierre administrativo",
} as const;
export const resultLabels = ["", "No mejoró", "Mejoró parcialmente", "Mejoró significativamente"];

export const suggestionInputSchema = z.object({
  respondentType: z.enum(["PATIENT", "FAMILY", "PSYCHOLOGIST", "PSYCHOLOGIST_IN_TRAINING", "ADMINISTRATIVE_STAFF", "OTHER"]),
  respondentTypeOther: z.string().trim().max(200).optional().nullable(),
  recordType: z.enum(["SUGGESTION", "OBSERVATION", "RECOGNITION", "IMPROVEMENT_NEEDED"]),
  area: z.enum(["PSYCHOLOGICAL_CARE", "ADMISSION", "HUMAN_RESOURCES", "INFRASTRUCTURE", "ORGANIZATION", "PSYCHOLOGISTS_IN_TRAINING", "OTHER"]),
  areaOther: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(1, "La descripción es obligatoria.").max(2000),
  improvementProposal: z.string().trim().max(1000).optional().nullable(),
  contactConsent: z.boolean(), contactName: z.string().trim().max(200).optional().nullable(),
  contactPhone: z.string().trim().max(64).optional().nullable(),
  perceivedImportance: z.enum(["LOW", "MEDIUM", "HIGH"]).nullable().optional(),
}).superRefine((v, ctx) => {
  if (v.respondentType === "OTHER" && !v.respondentTypeOther?.trim()) ctx.addIssue({ code: "custom", path: ["respondentTypeOther"], message: "Especifique la procedencia." });
  if (v.respondentType !== "OTHER" && v.respondentTypeOther) ctx.addIssue({ code: "custom", path: ["respondentTypeOther"], message: "Quite el texto libre si no seleccionó Otro." });
  if (v.area === "OTHER" && !v.areaOther?.trim()) ctx.addIssue({ code: "custom", path: ["areaOther"], message: "Especifique el área." });
  if (v.area !== "OTHER" && v.areaOther) ctx.addIssue({ code: "custom", path: ["areaOther"], message: "Quite el texto libre si no seleccionó Otro." });
  if (!v.contactConsent && (v.contactName || v.contactPhone)) ctx.addIssue({ code: "custom", path: ["contactConsent"], message: "No incluya datos de contacto si prefiere el anonimato." });
});
export type SuggestionInput = z.infer<typeof suggestionInputSchema>;
export type SuggestionStatus = keyof typeof statuses;
export type SuggestionPriority = keyof typeof priorities;
export type Suggestion = {
  id: string; code: string; status: SuggestionStatus; createdAt: string; recordType: keyof typeof recordTypes;
  area: keyof typeof areas; areaOther: string | null; channel: string; priority: SuggestionPriority | null;
  responsible: string | null; message: string; improvementProposal?: string | null; perceivedImportance: keyof typeof importanceOptions | null;
  respondentType: keyof typeof respondentTypes; respondentTypeOther: string | null; isAnonymous: boolean; version: number;
  contactConsent?: boolean; contactName?: string | null; contactPhone?: string | null; resultScore?: number | null;
  closureReason?: keyof typeof closureReasons | null; closureJustification?: string | null; closedAt?: string | null;
  actions?: SuggestionAction[]; history?: SuggestionHistory[]; isRecurrent?: boolean | null;
};
export type SuggestionAction = { id: string; action: string; responsible: string | null; dueDate: string | null; expectedEvidence: string | null; implementedAt: string | null; implementationEvidence: string | null; resultScore: number | null; createdAt: string };
export type SuggestionHistory = { id: string; event: string; fromStatus: SuggestionStatus; toStatus: SuggestionStatus; version: number; createdAt: string; changedBy: { firstName: string; lastName: string } | null; details: Record<string, unknown> | null };
