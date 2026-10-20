import api from "@/api/api";
import { getAuth } from "@/store/auth/auth.store";
import {
  suggestionInputSchema, suggestionSchema, suggestionsPageSchema, suggestionStatusSchema,
  type Suggestion, type SuggestionInput, type SuggestionFilters, type SuggestionStatus,
} from "../suggestions";

// Proposed contract only: confirm routes and DTOs with backend before enabling API mode.
const endpoint = "/api/v1/suggestions";
export const suggestionsDemoMode = import.meta.env.VITE_SUGGESTIONS_MODE !== "api";
const take = 10;

// ponytail: memory-only demo, lost on reload; replace with the API for shared persistence.
let demoSuggestions: Suggestion[] = [
  { id: "demo-1", category: "PROCESSES", message: "Podríamos unificar las indicaciones para el registro de pacientes y evitar completar los mismos datos dos veces.", isAnonymous: true, author: null, status: "NEW", createdAt: "2026-10-19T14:00:00Z" },
  { id: "demo-2", category: "WORK_ENVIRONMENT", message: "Propongo un espacio breve de coordinación entre áreas para compartir dificultades y reconocer las mejoras del equipo.", isAnonymous: false, author: { displayName: "Colaborador de ejemplo" }, status: "READ", createdAt: "2026-10-18T15:00:00Z" },
  { id: "demo-3", category: "INFRASTRUCTURE", message: "Sería útil revisar el aislamiento de sonido de los consultorios para mejorar la privacidad durante las sesiones.", isAnonymous: true, author: null, status: "IN_REVIEW", createdAt: "2026-10-17T16:00:00Z" },
  { id: "demo-4", category: "OTHER", message: "Sugiero centralizar los avisos internos en el sistema para que todos podamos consultarlos.", isAnonymous: false, author: { displayName: "Colaboradora de ejemplo" }, status: "ARCHIVED", createdAt: "2026-10-16T17:00:00Z" },
];

function requireManager() {
  if (!getAuth().user || getAuth().roleSelected !== "ADMIN") {
    throw new Error("Solo Gerencia puede consultar y gestionar las sugerencias recibidas.");
  }
}

export async function createSuggestionApi(input: SuggestionInput): Promise<Suggestion> {
  const { user, roleSelected } = getAuth();
  if (!user || !["ADMIN", "PSYCHOLOGIST", "ADMISSION", "CASHIER"].includes(roleSelected ?? "")) {
    throw new Error("Tu rol no tiene acceso al envío de sugerencias.");
  }
  // Strip extra fields: identity is never supplied by the client to the real API.
  const payload = suggestionInputSchema.parse(input);
  if (!suggestionsDemoMode) {
    const { data } = await api.post(endpoint, payload);
    return suggestionSchema.parse(data);
  }
  const suggestion = suggestionSchema.parse({
    ...payload,
    id: crypto.randomUUID(), status: "NEW", createdAt: new Date().toISOString(),
    author: payload.isAnonymous ? null : { displayName: `${user.firstName} ${user.lastName}`.trim() },
  });
  demoSuggestions = [suggestion, ...demoSuggestions];
  return suggestion;
}

export async function getSuggestionsApi(filters: SuggestionFilters, signal?: AbortSignal) {
  requireManager();
  if (!suggestionsDemoMode) {
    const { data } = await api.get(endpoint, { params: { ...filters, take }, signal });
    return suggestionsPageSchema.parse(data);
  }
  const filtered = demoSuggestions.filter((item) =>
    (!filters.category || item.category === filters.category) && (!filters.status || item.status === filters.status));
  return suggestionsPageSchema.parse({
    items: filtered.slice((filters.page - 1) * take, filters.page * take),
    total: filtered.length, page: filters.page, totalPages: Math.ceil(filtered.length / take),
  });
}

export async function updateSuggestionStatusApi({ id, status }: { id: string; status: SuggestionStatus }): Promise<Suggestion> {
  requireManager();
  const payload = { status: suggestionStatusSchema.parse(status) };
  if (!suggestionsDemoMode) {
    const { data } = await api.patch(`${endpoint}/${encodeURIComponent(id)}/status`, payload);
    return suggestionSchema.parse(data);
  }
  const current = demoSuggestions.find((item) => item.id === id);
  if (!current) throw new Error("La sugerencia ya no está disponible. Actualiza la bandeja.");
  const updated = { ...current, ...payload };
  demoSuggestions = demoSuggestions.map((item) => item.id === id ? updated : item);
  return updated;
}
