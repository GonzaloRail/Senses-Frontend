import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { attendanceError, downloadAttendanceReport, getAttendanceReport, justifyAttendanceDay } from "../api/attendanceApi";
import { AttendancePersonFilter } from "./AttendancePersonFilter";
import { AttendanceReasonForm } from "./AttendanceReasonForm";
import { AttendanceTable } from "./AttendanceTable";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { attendanceTime, limaMonth, workedTime } from "../utils/attendanceTime";

export function AttendanceMonthlyReport() {
  const [month, setMonth] = useState(limaMonth);
  const [userId, setUserId] = useState("");
  const [selected, setSelected] = useState<{ id: string; label: string }>();
  const query = useQuery({
    queryKey: ["attendance", "report", month, userId],
    queryFn: ({ signal }) => getAttendanceReport(month, userId, signal),
    enabled: Boolean(month),
    retry: false,
  });
  const download = useMutation({
    mutationFn: (format: "xlsx" | "pdf") => downloadAttendanceReport(month, userId, format),
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <Label className="flex-col items-start">Mes
          <Input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setSelected(undefined); }} />
        </Label>
        <AttendancePersonFilter value={userId} onChange={(id) => { setUserId(id); setSelected(undefined); }} />
        <Button variant="outline" disabled={!query.data || download.isPending} onClick={() => download.mutate("xlsx")}>Exportar Excel</Button>
        <Button variant="outline" disabled={!query.data || download.isPending} onClick={() => download.mutate("pdf")}>Exportar PDF</Button>
      </div>
      {download.isError && <p role="alert" className="text-destructive">No se pudo descargar el reporte.</p>}
      {month && query.isPending && <p>Cargando reporte…</p>}
      {query.isError && <p role="alert" className="text-destructive">{attendanceError(query.error, "No se pudo cargar el reporte.")}</p>}
      {query.data && (
        <>
          <h2 className="font-semibold">Resumen por persona</h2>
          <AttendanceTable headers={["Persona", "Días programados", "Asistencias", "Tardanzas", "Ausencias", "Trabajado"]} rows={query.data.people.map((person) => ({
            id: person.userId,
            cells: [person.fullName, person.scheduledDays, person.attendedDays, person.lateDays, person.absentDays, workedTime(person.workedMinutes)],
          }))} />
          <h2 className="font-semibold">Detalle por día</h2>
          {selected && <AttendanceReasonForm key={selected.id} title={`Justificar asistencia de ${selected.label}`} save={(reason) => justifyAttendanceDay(selected.id, reason)} onClose={() => setSelected(undefined)} />}
          <AttendanceTable headers={["Fecha", "Persona", "Horario", "Entrada", "Salida", "Trabajado", "Estado", "Justificación"]} rows={query.data.days.map((day) => ({
            id: day.id,
            cells: [day.date, day.fullName, day.expectedStart && day.expectedEnd ? `${day.expectedStart}–${day.expectedEnd}` : "—", attendanceTime(day.firstIn), attendanceTime(day.lastOut), workedTime(day.workedMinutes), <AttendanceStatusBadge status={day.status} />,
              day.isJustified ? day.justification ?? "Justificado" :
                ["AUSENTE", "TARDANZA", "SALIDA_ANTICIPADA", "INCOMPLETO"].includes(day.status) &&
                <Button size="sm" variant="outline" disabled={Boolean(selected)} onClick={() => setSelected({ id: day.id, label: `${day.fullName} (${day.date})` })}>Justificar</Button>],
          }))} />
        </>
      )}
    </div>
  );
}
