import api from "@/api/api";
import { suggestionInputSchema, type Suggestion, type SuggestionInput, type SuggestionStatus } from "../suggestions";

const endpoint = "/api/v1/suggestions";
export type Filters = { page: number; take?: number; q?: string; recordType?: string; area?: string; status?: string; priority?: string; channel?: string; isAnonymous?: string; dateFrom?: string; dateTo?: string };
export async function createSuggestion(input: SuggestionInput, mode: "staff" | "physical" | "public" = "staff") {
  const payload = suggestionInputSchema.parse(input);
  const body = mode === "physical" && !payload.perceivedImportance ? { ...payload, perceivedImportance: null } : payload;
  const path = mode === "public" ? `${endpoint}/public` : endpoint;
  const { data } = await api.post(path, body);
  return data as Pick<Suggestion, "id" | "code" | "status" | "createdAt">;
}
export async function getSuggestions(filters: Filters) {
  const { data } = await api.get(endpoint, { params: { take: 20, ...filters } });
  return data as { data: Suggestion[]; meta: { page: number; take: number; total: number; totalPages: number } };
}
export async function getSuggestion(id: string) {
  const { data } = await api.get(`${endpoint}/${encodeURIComponent(id)}`);
  return data as Suggestion;
}
export async function updateSuggestion(id: string, expectedVersion: number, changes: Record<string, unknown>) {
  const { data } = await api.patch(`${endpoint}/${encodeURIComponent(id)}`, { expectedVersion, ...changes });
  return data as Suggestion;
}
export async function addAction(id: string, expectedVersion: number, action: Record<string, unknown>) {
  const { data } = await api.post(`${endpoint}/${encodeURIComponent(id)}/actions`, { expectedVersion, ...action });
  return data as Suggestion;
}
export async function updateAction(id: string, actionId: string, expectedVersion: number, change: { implemented: boolean; implementationEvidence?: string; resultScore?: number | null }) {
  const { data } = await api.patch(`${endpoint}/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}`, { expectedVersion, ...change });
  return data as Suggestion;
}
export async function getSuggestionReport(month: string) {
  const { data } = await api.get(`${endpoint}/report`, { params: { month } });
  return data;
}
export async function downloadSuggestionReport(month: string, format: "pdf" | "xlsx") {
  const { data } = await api.get(`${endpoint}/report`, { params: { month, format }, responseType: "blob" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a"); link.href = url; link.download = `buzon-sugerencias-${month}.${format}`; link.click(); URL.revokeObjectURL(url);
}
export const suggestionStatusValues: SuggestionStatus[] = ["NEW", "IN_ANALYSIS", "ACTION_PLANNED", "FOLLOW_UP", "CLOSED"];
