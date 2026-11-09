import { isAxiosError } from "axios";
import { z } from "zod";
import api from "@/api/api";

const endpoint = "/api/v1/attendance";
const timestamp = z.string().datetime({ offset: true });
const status = z.enum([
  "PUNTUAL", "TARDANZA", "SALIDA_ANTICIPADA", "INCOMPLETO",
  "AUSENTE", "PERMISO", "SIN_HORARIO", "NO_LABORABLE",
]);
const record = z.object({
  id: z.string().uuid(),
  type: z.enum(["IN", "OUT"]),
  punchedAt: timestamp,
});
const punchResponse = z.object({
  record,
  user: z.object({ id: z.string().uuid(), fullName: z.string() }),
  provisionalDay: z.object({
    date: z.string(),
    status,
    expectedStart: z.string().nullable(),
    expectedEnd: z.string().nullable(),
    lateMinutes: z.number(),
    earlyLeaveMinutes: z.number(),
  }),
});
const todayResponse = z.object({
  date: z.string(),
  staff: z.array(z.object({
    userId: z.string().uuid(),
    fullName: z.string(),
    firstIn: timestamp.nullable(),
    lastOut: timestamp.nullable(),
    punchesCount: z.number(),
    status,
  })),
});

export type Punch = z.infer<typeof punchResponse>;

export async function registerPunch(input: { dni: string; source: "DNI_MANUAL" | "BARCODE" }) {
  const { data } = await api.post<unknown>(`${endpoint}/punch`, input);
  return punchResponse.parse(data);
}

export async function undoPunch(id: string) {
  await api.post(`${endpoint}/records/${encodeURIComponent(id)}/undo`);
}

export async function getAttendanceToday(signal: AbortSignal) {
  const { data } = await api.get<unknown>(`${endpoint}/today`, { signal });
  return todayResponse.parse(data);
}

export function attendanceError(error: unknown, fallback: string) {
  if (isAxiosError(error) && error.response && error.response.status < 500) {
    const parsed = z.object({ message: z.string() }).safeParse(error.response.data);
    if (parsed.success) return parsed.data.message;
  }
  return fallback;
}
