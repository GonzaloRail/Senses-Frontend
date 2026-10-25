import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, CalendarDays, ChevronLeft, ChevronRight, Clock3, Info, RefreshCw, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { limaDate } from "@/shared/utils/limaDates";
import { getDailySchedule, getScheduleFilters, type ScheduleShiftFilter } from "../api/consolidatedScheduleApi";
import { leaveIntervalLabel, moveScheduleDate, scheduleDateTitle, scheduleErrorMessage, validScheduleDate } from "../utils/consolidatedSchedule";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const statusClass = {
  PROGRAMMED: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  PARTIALLY_ON_LEAVE: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  ON_LEAVE: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
};

export function GeneralSchedule() {
  const [date, setDate] = useState(() => limaDate(new Date()));
  const [selection, setSelection] = useState({ locationId: "", psychologistId: "all" });
  const [shift, setShift] = useState<ScheduleShiftFilter>("ALL");
  const sites = useQuery({
    queryKey: ["consolidated-schedule-locations"],
    queryFn: ({ signal }) => getScheduleFilters(undefined, signal),
    retry: false, staleTime: 30_000, refetchOnWindowFocus: "always",
  });
  const locations = sites.data?.locations ?? [];
  const locationId = locations.some((site) => site.id === selection.locationId)
    ? selection.locationId : locations[0]?.id ?? "";
  const location = locations.find((site) => site.id === locationId);
  const people = useQuery({
    queryKey: ["consolidated-schedule-filters", locationId],
    queryFn: ({ signal }) => getScheduleFilters(locationId, signal),
    enabled: Boolean(locationId) && !sites.isError,
    retry: false, staleTime: 30_000, refetchOnWindowFocus: "always",
  });
  const psychologists = people.data?.psychologists ?? [];
  const validPerson = selection.psychologistId === "all" ||
    psychologists.some((person) => person.id === selection.psychologistId);
  const validDate = validScheduleDate(date);
  const canQuery = Boolean(locationId) && validDate && validPerson && people.isSuccess && !sites.isError;
  const report = useQuery({
    queryKey: ["consolidated-schedule", date, locationId, selection.psychologistId, shift],
    queryFn: ({ signal }) => getDailySchedule({
      date, locationId, shift,
      psychologistId: selection.psychologistId === "all" ? undefined : selection.psychologistId,
    }, signal),
    enabled: canQuery,
    retry: false, staleTime: 30_000, refetchOnWindowFocus: "always",
  });
  const error = sites.isError ? sites.error : people.isError ? people.error : report.isError ? report.error : null;
  const loading = sites.isPending || (Boolean(locationId) && people.isPending) || (canQuery && report.isPending);
  const data = canQuery && !error && !loading ? report.data : undefined;
  const fetching = sites.isFetching || people.isFetching || report.isFetching;

  function reset() {
    setDate(limaDate(new Date()));
    setSelection({ locationId, psychologistId: "all" });
    setShift("ALL");
  }

  async function refresh() {
    if (sites.isError) { await sites.refetch(); return; }
    if (people.isError) { await people.refetch(); return; }
    if (canQuery) await Promise.all([sites.refetch(), people.refetch(), report.refetch()]);
    else { await sites.refetch(); if (locationId) await people.refetch(); }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consulta operativa · Admisión</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Programación general por sede</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Consulta los bloques laborales y consultorios del día, sin entrar a cada agenda.</p>
        </div>
        <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">Solo lectura</span>
      </header>

      <section aria-label="Filtros de programación" className="rounded-xl border bg-card p-4 md:p-5">
        <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Fecha</Label>
            <Input id="schedule-date" type="date" value={date} aria-invalid={!validDate} onChange={(event) => setDate(event.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-location">Sede</Label>
            <select id="schedule-location" className={selectClass} value={locationId} disabled={!locations.length || sites.isError} onChange={(event) => setSelection({ locationId: event.target.value, psychologistId: "all" })}>
              {!locations.length && <option value="">{sites.isPending ? "Cargando sedes…" : "Sin sedes disponibles"}</option>}
              {locations.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-psychologist">Psicólogo</Label>
            <select id="schedule-psychologist" className={selectClass} value={selection.psychologistId} disabled={!locationId || !people.isSuccess} onChange={(event) => setSelection((current) => ({ ...current, psychologistId: event.target.value }))}>
              <option value="all">{people.isPending && locationId ? "Cargando psicólogos…" : "Todos los psicólogos"}</option>
              {!validPerson && <option value={selection.psychologistId}>Selección no disponible</option>}
              {psychologists.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-shift">Turno</Label>
            <select id="schedule-shift" className={selectClass} value={shift} onChange={(event) => setShift(event.target.value as ScheduleShiftFilter)}>
              <option value="ALL">Todos los turnos</option>
              <option value="MORNING">Mañana</option>
              <option value="AFTERNOON">Tarde</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">Los filtros se aplican automáticamente. Al cambiar de sede se restablece el psicólogo.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" />Hoy y todos</Button>
            <Button variant="outline" onClick={() => void refresh()} disabled={fetching}><RefreshCw className={fetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />{fetching ? "Actualizando…" : "Actualizar"}</Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-card p-6" role="alert">
          <p className="font-semibold">No se pudo cargar la programación</p>
          <p className="mt-2 text-sm text-muted-foreground">{scheduleErrorMessage(error)}</p>
          <Button className="mt-4" variant="outline" disabled={fetching} onClick={() => void refresh()}>Reintentar</Button>
        </div>
      ) : !validDate ? (
        <p className="rounded-xl border bg-card p-6 text-sm" role="alert">Selecciona una fecha de calendario válida para consultar.</p>
      ) : !validPerson && people.isSuccess ? (
        <p className="rounded-xl border bg-card p-6 text-sm" role="alert">El psicólogo ya no está disponible en esta sede. Selecciona otro o utiliza “Todos los psicólogos”.</p>
      ) : loading ? (
        <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground" role="status">Cargando programación…</p>
      ) : !locations.length ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">No hay sedes activas disponibles para consultar.</p>
      ) : data ? (
        <section className="overflow-hidden rounded-xl border bg-card" aria-labelledby="schedule-results" aria-busy={report.isFetching}>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
            <div>
              <h2 id="schedule-results" className="flex items-center gap-2 text-lg font-semibold"><Building2 className="h-5 w-5 text-muted-foreground" />{data.location.name}</h2>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{scheduleDateTitle(data.date)}</p>
              {data.location.address && <p className="mt-1 text-xs text-muted-foreground">{data.location.address}</p>}
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" aria-label="Día anterior" onClick={() => setDate(moveScheduleDate(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" aria-label="Día siguiente" onClick={() => setDate(moveScheduleDate(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 border-b bg-muted/20 px-5 py-4 text-sm" aria-live="polite">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><strong>{data.summary.professionalsCount}</strong> profesionales</span>
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted-foreground" /><strong>{data.summary.blocksCount}</strong> bloques laborales</span>
            <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><strong>{data.summary.assignedOfficesCount}</strong> consultorios asignados</span>
          </div>
          {(data.summary.conflictBlocksCount > 0 || data.summary.partiallyOnLeaveBlocksCount > 0 || data.summary.onLeaveBlocksCount > 0) && (
            <div className="m-4 space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" role="note">
              {data.summary.conflictBlocksCount > 0 && <p className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{data.summary.conflictBlocksCount} bloques con conflicto de consultorio. El conflicto puede involucrar asignaciones fuera del filtro actual.</p>}
              {(data.summary.partiallyOnLeaveBlocksCount > 0 || data.summary.onLeaveBlocksCount > 0) && <p>Permisos parciales: {data.summary.partiallyOnLeaveBlocksCount} · Ausencias de todo el bloque: {data.summary.onLeaveBlocksCount}. Revisa los intervalos en la tabla.</p>}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <caption className="sr-only">Programación de {data.location.name}, {scheduleDateTitle(data.date)}. Una fila por bloque laboral.</caption>
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>{["Psicólogo", "Turno", "Horario", "Consultorio físico", "Estado", "Observaciones"].map((title) => <th key={title} scope="col" className="px-5 py-3 text-left font-medium">{title}</th>)}</tr>
              </thead>
              <tbody>
                {data.blocks.map((block) => (
                  <tr key={block.scheduleId} className="border-t transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium">{block.psychologistName}</td>
                    <td className="px-5 py-4">{block.shiftLabel}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums">{block.startTime}–{block.endTime}</td>
                    <td className="px-5 py-4">{block.officeName}</td>
                    <td className="px-5 py-4"><span className={"inline-block rounded-md border px-2 py-1 text-xs font-medium " + statusClass[block.status]}>{block.statusLabel}</span></td>
                    <td className="min-w-[230px] space-y-2 px-5 py-4">
                      {block.isConflict && <p className="text-xs font-medium text-destructive">{block.conflictNote ?? "Conflicto de horario en el consultorio."}</p>}
                      {block.leaveIntervals.length > 0 && <div className="text-xs"><p className="font-medium">Permiso / Licencia aprobada</p>{block.leaveIntervals.map((interval) => <p className="mt-1 tabular-nums" key={interval.startAt + interval.endAt}>{leaveIntervalLabel(interval)} · Lima</p>)}</div>}
                      {!block.isConflict && block.leaveIntervals.length === 0 && <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
                {data.blocks.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center"><CalendarDays className="mx-auto mb-3 h-7 w-7 text-muted-foreground" /><p className="font-medium">No hay programación para estos filtros</p><p className="mt-2 text-sm text-muted-foreground">Prueba otra fecha, sede, psicólogo o turno. Esto no garantiza que el consultorio esté libre para agendar.</p></td></tr>}
              </tbody>
            </table>
          </div>
          <p className="border-t px-5 py-3 text-xs text-muted-foreground">Horarios en Lima · Corte provisional de turnos: {data.shiftCutoff} · Los bloques que cruzan el corte conservan su horario completo.</p>
        </section>
      ) : null}

      {location && <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p><strong className="font-medium text-foreground">Programación no es disponibilidad para citas.</strong> Los horarios y sus partes sin permiso pueden tener reservas. Esta vista no crea citas ni modifica horarios.</p>
          <p>La consulta aplica la programación semanal actualmente registrada a la fecha elegida; no garantiza reconstruir horarios históricos. Las agendas individuales siguen disponibles en la otra vista.</p>
        </div>
      </div>}
    </div>
  );
}
