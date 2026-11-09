import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { getAttendanceToday } from "../api/attendanceApi";
import { AttendanceStatusBadge } from "../components/AttendanceStatusBadge";
import { AttendanceMonthlyReport } from "../components/AttendanceMonthlyReport";
import { AttendanceRecords } from "../components/AttendanceRecords";
import { AttendanceSettings } from "../components/AttendanceSettings";
import { AttendanceTable } from "../components/AttendanceTable";
import { attendanceTime } from "../utils/attendanceTime";

function AttendanceToday() {
  const query = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: ({ signal }) => getAttendanceToday(signal),
    refetchInterval: 30_000,
    retry: false,
  });
  if (query.isPending) return <p>Cargando asistencia de hoy…</p>;
  if (query.isError) return <p role="alert" className="text-destructive">No se pudo cargar la asistencia de hoy.</p>;
  const staff = query.data.staff;
  return (
    <div className="space-y-3">
      <p className="rounded-lg border p-4 text-sm">
        {query.data.date} · {staff.filter((person) => person.punchesCount > 0).length} con marcaje · {staff.filter((person) => person.status === "PENDIENTE").length} pendientes · {staff.filter((person) => person.status === "PERMISO").length} con permiso
      </p>
      <AttendanceTable headers={["Persona", "Horario", "Entrada", "Salida", "Estado"]} rows={staff.map((person) => ({
        id: person.userId,
        cells: [person.fullName, person.expectedSchedule, attendanceTime(person.firstIn), attendanceTime(person.lastOut), <AttendanceStatusBadge status={person.status} />],
      }))} />
    </div>
  );
}

const sections = [
  { title: "Hoy", Page: AttendanceToday },
  { title: "Registros", Page: AttendanceRecords },
  { title: "Resumen mensual", Page: AttendanceMonthlyReport },
  { title: "Configuración", Page: AttendanceSettings },
];

export function AttendanceManagementPage() {
  const [section, setSection] = useState(0);
  const Page = sections[section].Page;
  return (
    <>
      <SiteHeader title="Control de asistencia" />
      <main className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
        <nav aria-label="Secciones de asistencia" className="flex flex-wrap gap-2">
          {sections.map(({ title }, index) => (
            <Button key={title} variant={index === section ? "default" : "outline"} aria-pressed={index === section} onClick={() => setSection(index)}>{title}</Button>
          ))}
        </nav>
        <Page />
      </main>
    </>
  );
}
