import { z } from "zod";
import api from "@/api/api";

const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const count = z.number().int().nonnegative();

const filtersSchema = z.object({
  locations: z.array(z.object({ id: z.string().min(1), name: z.string(), address: z.string() })),
  psychologists: z.array(z.object({ id: z.string().min(1), fullName: z.string() })),
});

const blockSchema = z.object({
  scheduleId: z.string().min(1),
  psychologistId: z.string().min(1),
  psychologistName: z.string(),
  officeId: z.string().min(1),
  officeName: z.string(),
  shift: z.enum(["MORNING", "AFTERNOON", "FULL_DAY"]),
  shiftLabel: z.string(),
  startTime: clock,
  endTime: clock,
  status: z.enum(["PROGRAMMED", "PARTIALLY_ON_LEAVE", "ON_LEAVE"]),
  statusLabel: z.string(),
  leaveIntervals: z.array(z.object({
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }),
  })),
  isConflict: z.boolean(),
  conflictNote: z.string().nullable(),
});

const dailySchema = z.object({
  date: z.string(),
  timeZone: z.literal("America/Lima"),
  shiftCutoff: clock,
  location: z.object({ id: z.string().min(1), name: z.string(), address: z.string() }),
  blocks: z.array(blockSchema),
  summary: z.object({
    totalOfficesInLocation: count,
    assignedOfficesCount: count,
    professionalsCount: count,
    blocksCount: count,
    programmedBlocksCount: count,
    partiallyOnLeaveBlocksCount: count,
    onLeaveBlocksCount: count,
    conflictBlocksCount: count,
  }),
});

export type ScheduleFilters = z.infer<typeof filtersSchema>;
export type DailySchedule = z.infer<typeof dailySchema>;
export type ScheduleBlock = DailySchedule["blocks"][number];
export type ScheduleShiftFilter = "ALL" | "MORNING" | "AFTERNOON";

export interface DailyScheduleParams {
  date: string;
  locationId: string;
  psychologistId?: string;
  shift: ScheduleShiftFilter;
}

const endpoint = "/api/v1/work-schedules/consolidated-matrix";

function unwrap<T>(schema: z.ZodType<T>, payload: unknown): T {
  const envelope = z.object({ status: z.literal("success"), data: z.unknown() }).safeParse(payload);
  const result = schema.safeParse(envelope.success ? envelope.data.data : undefined);
  if (!envelope.success || !result.success) {
    throw new Error("La respuesta del backend no coincide con el contrato de horarios. Verifica que esté actualizada la implementación de HU-0023.");
  }
  return result.data;
}

export async function getScheduleFilters(locationId?: string, signal?: AbortSignal): Promise<ScheduleFilters> {
  const response = await api.get(endpoint + "/filters", {
    params: { locationId: locationId || undefined }, signal,
  });
  return unwrap(filtersSchema, response.data);
}

export async function getDailySchedule(params: DailyScheduleParams, signal?: AbortSignal): Promise<DailySchedule> {
  const response = await api.get(endpoint, {
    params: { ...params, psychologistId: params.psychologistId || undefined }, signal,
  });
  return unwrap(dailySchema, response.data);
}
