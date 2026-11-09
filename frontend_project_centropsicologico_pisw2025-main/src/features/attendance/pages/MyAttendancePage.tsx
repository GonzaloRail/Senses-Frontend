import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { attendanceError, getMyAttendance } from "../api/attendanceApi";
import { AttendanceStatusBadge } from "../components/AttendanceStatusBadge";
import { AttendanceTable } from "../components/AttendanceTable";
import { attendanceTime, limaMonth, workedTime } from "../utils/attendanceTime";

export function MyAttendancePage() {
  const [month, setMonth] = useState(limaMonth);
  const query = useQuery({
    queryKey: ["attendance", "me", month],
    queryFn: ({ signal }) => getMyAttendance(month, signal),
    enabled: Boolean(month),
    retry: false,
  });
  const summary = query.data?.summary;
  return (
    <>
      <SiteHeader title="Mi asistencia" />
      <main className="mx-auto w-full max-w-6xl space-y-4 p-4 lg:p-6">
        <Label className="w-fit flex-col items-start">Mes
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </Label>
        {month && query.isPending && <p>Cargando asistencia…</p>}
        {query.isError && <p role="alert" className="text-destructive">{attendanceError(query.error, "No se pudo cargar tu asistencia.")}</p>}
        {query.data && !query.data.user.attendanceRequired && <p className="rounded-lg border p-4">Tu usuario no tiene habilitado el registro de asistencia.</p>}
        {summary && (
          <p className="rounded-lg border p-4 text-sm">
            {summary.workedHours} h trabajadas · {summary.punctualDays} días puntuales · {summary.lateDays} tardanzas ({summary.totalLateMinutes} min) · {summary.absentDays} ausencias · {summary.leaveDays} permisos
          </p>
        )}
        {query.data && <AttendanceTable headers={["Fecha", "Horario", "Entrada", "Salida", "Trabajado", "Estado", "Justificación"]} rows={query.data.days.map((day) => ({
          id: day.id,
          cells: [day.date, day.expectedSchedule, attendanceTime(day.firstIn), attendanceTime(day.lastOut), workedTime(day.workedMinutes), <AttendanceStatusBadge status={day.status} />, day.isJustified ? day.justification ?? "Justificado" : "—"],
        }))} />}
      </main>
    </>
  );
}
