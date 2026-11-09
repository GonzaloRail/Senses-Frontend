import { isAxiosError } from "axios";
import { z } from "zod";
import api from "@/api/api";

const endpoint = "/api/v1/attendance";
const timestamp = z.string().datetime({ offset: true });
export const attendanceStatus = z.enum([
  "PUNTUAL", "TARDANZA", "SALIDA_ANTICIPADA", "INCOMPLETO",
  "AUSENTE", "PERMISO", "SIN_HORARIO", "NO_LABORABLE", "PENDIENTE",
]);
const record = z.object({
  id: z.string().uuid(),
  type: z.enum(["IN", "OUT"]),
  punchedAt: timestamp,
});
const punchResponse = z.object({
  record,
  undoUntil: timestamp,
  user: z.object({ id: z.string().uuid(), firstName: z.string(), lastName: z.string() })
    .transform(({ id, firstName, lastName }) => ({ id, fullName: `${firstName} ${lastName}`.trim() })),
  provisionalDay: z.object({
    date: z.string(),
    status: attendanceStatus,
    expectedStart: z.string().nullable(),
    expectedEnd: z.string().nullable(),
    lateMinutes: z.number(),
    earlyLeaveMinutes: z.number(),
  }),
});
const todayResponse = z.object({
  date: z.string(),
  serverTime: timestamp,
  data: z.array(z.object({
    userId: z.string().uuid(),
    fullName: z.string(),
    firstIn: timestamp.nullable(),
    lastOut: timestamp.nullable(),
    punchesCount: z.number(),
    expectedSchedule: z.string(),
    status: attendanceStatus,
  })),
}).transform(({ data, ...today }) => ({ ...today, staff: data }));

export type Punch = z.infer<typeof punchResponse>;
export const attendanceLabels: Record<z.infer<typeof attendanceStatus>, string> = {
  PUNTUAL: "Puntual",
  TARDANZA: "Tardanza",
  SALIDA_ANTICIPADA: "Salida anticipada",
  INCOMPLETO: "Sin salida",
  AUSENTE: "Ausente",
  PERMISO: "Con permiso",
  SIN_HORARIO: "Sin horario",
  NO_LABORABLE: "No laborable",
  PENDIENTE: "Pendiente",
};

const attendanceDay = z.object({
  id: z.string(),
  date: z.string(),
  firstIn: timestamp.nullable(),
  lastOut: timestamp.nullable(),
  workedMinutes: z.number(),
  status: attendanceStatus,
  isJustified: z.boolean(),
  justification: z.string().nullable(),
});
const selfResponse = z.object({
  user: z.object({ attendanceRequired: z.boolean() }),
  summary: z.object({
    workedHours: z.number(), punctualDays: z.number(), lateDays: z.number(),
    absentDays: z.number(), totalLateMinutes: z.number(), leaveDays: z.number(),
  }),
  days: z.array(attendanceDay.extend({ expectedSchedule: z.string(), records: z.array(record) })),
});
const reportResponse = z.object({
  people: z.array(z.object({
    userId: z.string(), fullName: z.string(), scheduledDays: z.number(), attendedDays: z.number(),
    lateDays: z.number(), absentDays: z.number(), workedMinutes: z.number(),
  })),
  days: z.array(attendanceDay.extend({ fullName: z.string(), expectedStart: z.string().nullable(), expectedEnd: z.string().nullable() })),
});
export const sourceLabels = {
  DNI_MANUAL: "DNI digitado", BARCODE: "Lector", BIOMETRIC: "Biométrico", MANUAL_ENTRY: "Manual",
} as const;
export type PunchSource = keyof typeof sourceLabels;
const recordsResponse = z.object({
  totalPages: z.number(),
  records: z.array(record.extend({
    source: z.enum(["DNI_MANUAL", "BARCODE", "BIOMETRIC", "MANUAL_ENTRY"]),
    user: z.object({ firstName: z.string(), lastName: z.string() }),
    voidedAt: timestamp.nullable(),
  })),
});
const policySchema = z.object({
  lateToleranceMinutes: z.number().int().min(0).max(60),
  earlyLeaveToleranceMinutes: z.number().int().min(0).max(60),
  antiDoublePunchSeconds: z.number().int().min(5).max(300),
  undoWindowMinutes: z.number().int().min(1).max(30),
  dailyCloseTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
});
export type AttendancePolicy = z.infer<typeof policySchema>;
const nonWorkingDaySchema = z.object({ id: z.string(), date: z.string(), description: z.string() });

async function read<T>(path: string, schema: z.ZodType<T>, params?: object, signal?: AbortSignal) {
  const { data } = await api.get<unknown>(`${endpoint}${path}`, { params, signal });
  return schema.parse(data);
}

export const getMyAttendance = (month: string, signal: AbortSignal) =>
  read("/me", selfResponse, { month }, signal);
export const getAttendanceReport = (month: string, userId: string, signal: AbortSignal) =>
  read("/report", reportResponse, { month, userId: userId || undefined }, signal);
export const getAttendanceRecords = (filters: {
  from?: string; to?: string; userId?: string; source?: PunchSource; includeVoided: boolean; page: number;
}, signal: AbortSignal) => read("/records", recordsResponse, filters, signal);
export const getAttendancePolicy = (signal: AbortSignal) => read("/policy", policySchema, undefined, signal);
export const getNonWorkingDays = (signal: AbortSignal) => read("/non-working-days", z.array(nonWorkingDaySchema), undefined, signal);

export async function updateAttendancePolicy(policy: AttendancePolicy) {
  await api.put(`${endpoint}/policy`, policySchema.parse(policy));
}
export async function createNonWorkingDay(date: string, description: string) {
  await api.post(`${endpoint}/non-working-days`, { date, description });
}
export async function deleteNonWorkingDay(id: string) {
  await api.delete(`${endpoint}/non-working-days/${encodeURIComponent(id)}`);
}
export async function createManualPunch(input: { userId: string; type: "IN" | "OUT"; punchedAt: string; reason: string }) {
  await api.post(`${endpoint}/records/manual`, input);
}
export async function voidAttendanceRecord(id: string, reason: string) {
  await api.post(`${endpoint}/records/${encodeURIComponent(id)}/void`, { reason });
}
export async function justifyAttendanceDay(id: string, justification: string) {
  await api.patch(`${endpoint}/days/${encodeURIComponent(id)}/justify`, { justification });
}
export async function downloadAttendanceReport(month: string, userId: string, format: "xlsx" | "pdf") {
  const { data } = await api.get<Blob>(`${endpoint}/report/export`, {
    params: { month, userId: userId || undefined, format },
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `asistencia-${month}.${format}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
