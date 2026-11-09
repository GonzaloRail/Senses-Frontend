import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { attendanceLabels, type attendanceStatus } from "../api/attendanceApi";

type Status = z.infer<typeof attendanceStatus>;
const colors: Record<Status, string> = {
  PUNTUAL: "border-green-200 bg-green-50 text-green-900",
  TARDANZA: "border-amber-200 bg-amber-50 text-amber-950",
  SALIDA_ANTICIPADA: "border-orange-200 bg-orange-50 text-orange-900",
  INCOMPLETO: "border-violet-200 bg-violet-50 text-violet-900",
  AUSENTE: "border-red-200 bg-red-50 text-red-900",
  PERMISO: "border-blue-200 bg-blue-50 text-blue-900",
  SIN_HORARIO: "border-slate-200 bg-slate-50 text-slate-800",
  NO_LABORABLE: "border-slate-200 bg-slate-50 text-slate-800",
  PENDIENTE: "border-slate-200 bg-slate-50 text-slate-800",
};

export function AttendanceStatusBadge({ status }: { status: Status }) {
  return <Badge variant="outline" className={colors[status]}>{attendanceLabels[status]}</Badge>;
}
