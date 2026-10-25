import { isAxiosError } from "axios";
import type { ScheduleBlock } from "../api/consolidatedScheduleApi";

export function validScheduleDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T12:00:00Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function moveScheduleDate(value: string, offset: number): string {
  if (!validScheduleDate(value)) return value;
  const next = new Date(value + "T12:00:00Z");
  next.setUTCDate(next.getUTCDate() + offset);
  const result = next.toISOString().slice(0, 10);
  return validScheduleDate(result) ? result : value;
}

export function scheduleDateTitle(value: string): string {
  if (!validScheduleDate(value)) return "Selecciona una fecha válida";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima", weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(value + "T12:00:00-05:00"));
}

export function leaveIntervalLabel(interval: ScheduleBlock["leaveIntervals"][number]): string {
  const format = (value: string) => new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value));
  return format(interval.startAt) + "–" + format(interval.endAt);
}

export function scheduleErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 401: return "Tu sesión no está vigente. Vuelve a iniciar sesión.";
      case 403: return "Tu rol no tiene permiso para consultar esta programación.";
      case 404: return "No se encontró el recurso solicitado. Si los filtros son válidos, verifica que el backend tenga disponibles los endpoints de HU-0023.";
      case 400: return "No se pudo consultar con estos filtros. Revisa la fecha, sede y psicólogo; alguno puede estar inactivo.";
      default: return error.response
        ? "El servidor no pudo obtener la programación. Intenta nuevamente."
        : "No hay conexión con el backend. Comprueba que esté encendido e intenta nuevamente.";
    }
  }
  return error instanceof Error ? error.message : "No se pudo cargar la programación.";
}
