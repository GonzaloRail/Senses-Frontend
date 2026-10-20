import { useState } from "react";
import { Building2, CalendarDays, ChevronLeft, ChevronRight, Clock3, FlaskConical, Info, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_DATE, DEMO_LOCATIONS, DEMO_PSYCHOLOGISTS, filterDemoSchedule, summarizeDemoSchedule } from "../demo/generalScheduleDemo";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function dateTitle(date: string) {
  return date ? new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima", weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(`${date}T12:00:00-05:00`)) : "Selecciona una fecha";
}

export function GeneralScheduleDemo() {
  const [date, setDate] = useState(DEMO_DATE);
  const [locationId, setLocationId] = useState("central");
  const [psychologistId, setPsychologistId] = useState("all");
  const blocks = filterDemoSchedule(date, locationId, psychologistId);
  const summary = summarizeDemoSchedule(blocks);
  const location = DEMO_LOCATIONS.find((item) => item.id === locationId)!;

  function moveDay(offset: number) {
    if (!date) return;
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + offset);
    setDate(next.toISOString().slice(0, 10));
  }

  function reset() {
    setDate(DEMO_DATE);
    setLocationId("central");
    setPsychologistId("all");
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 p-4 md:p-6">
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="note">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Prototipo HU-0023 · Datos ficticios</p>
          <p className="mt-1 text-sm">Demostración para validar la propuesta con el equipo. Esta vista no consulta el backend ni guarda cambios.</p>
        </div>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consulta operativa · Admisión</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Programación general por sede</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Todos los bloques laborales y consultorios del día, en una sola vista. Sin entrar a cada agenda.</p>
        </div>
        <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">Solo lectura</span>
      </header>

      <section aria-label="Filtros de programación" className="rounded-xl border bg-card p-4 md:p-5">
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="general-schedule-date">Fecha</Label>
            <Input id="general-schedule-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="general-schedule-location">Sede</Label>
            <select id="general-schedule-location" className={selectClass} value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              {DEMO_LOCATIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="general-schedule-psychologist">Psicólogo</Label>
            <select id="general-schedule-psychologist" className={selectClass} value={psychologistId} onChange={(event) => setPsychologistId(event.target.value)}>
              <option value="all">Todos los psicólogos</option>
              {DEMO_PSYCHOLOGISTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <Button variant="outline" className="h-10" onClick={reset}><RotateCcw className="h-4 w-4" />Restablecer ejemplo</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
          <span className="text-muted-foreground">Explorar ejemplos:</span>
          <Button size="sm" variant={date === DEMO_DATE ? "secondary" : "ghost"} onClick={() => setDate(DEMO_DATE)}>19 oct · Varios bloques</Button>
          <Button size="sm" variant={date === "2026-10-20" ? "secondary" : "ghost"} onClick={() => setDate("2026-10-20")}>20 oct · Otra programación</Button>
          <Button size="sm" variant={date === "2026-10-21" ? "secondary" : "ghost"} onClick={() => setDate("2026-10-21")}>21 oct · Sin programación</Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card" aria-labelledby="general-schedule-results">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 id="general-schedule-results" className="flex items-center gap-2 text-lg font-semibold"><Building2 className="h-5 w-5 text-muted-foreground" />{location.name}</h2>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{dateTitle(date)}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" disabled={!date} aria-label="Día anterior" onClick={() => moveDay(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" disabled={!date} aria-label="Día siguiente" onClick={() => moveDay(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-7 gap-y-3 border-b bg-muted/20 px-5 py-4 text-sm" aria-live="polite" aria-atomic="true">
          <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><strong>{summary.psychologists}</strong> profesionales</span>
          <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted-foreground" /><strong>{summary.blocks}</strong> bloques laborales</span>
          <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><strong>{summary.offices}</strong> consultorios asignados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <caption className="sr-only">Programación ficticia de {location.name}, {dateTitle(date)}. Una fila por bloque laboral.</caption>
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 text-left font-medium">Psicólogo</th>
                <th scope="col" className="px-5 py-3 text-left font-medium">Inicio</th>
                <th scope="col" className="px-5 py-3 text-left font-medium">Fin</th>
                <th scope="col" className="px-5 py-3 text-left font-medium">Consultorio físico</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => {
                const professional = DEMO_PSYCHOLOGISTS.find((item) => item.id === block.psychologistId)!;
                const hasMultiple = blocks.filter((item) => item.psychologistId === block.psychologistId).length > 1;
                return (
                  <tr key={block.id} className="border-t transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-medium">{professional.name}</p>
                      {hasMultiple && <p className="mt-1 text-xs text-muted-foreground">Más de un bloque este día</p>}
                    </td>
                    <td className="px-5 py-4 font-medium tabular-nums">{block.start}</td>
                    <td className="px-5 py-4 font-medium tabular-nums">{block.end}</td>
                    <td className="px-5 py-4"><span className="inline-flex items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{block.office}</span></td>
                  </tr>
                );
              })}
              {blocks.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center">
                  <CalendarDays className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                  <p className="font-medium">{date ? "Sin programación de ejemplo para estos filtros" : "Selecciona una fecha para consultar"}</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Solo hay datos ficticios para el 19 y 20 de octubre de 2026. Esto no representa la disponibilidad real de la sede.</p>
                  <Button className="mt-4" variant="outline" onClick={reset}>Volver al ejemplo inicial</Button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t px-5 py-3 text-xs text-muted-foreground">Horarios en Lima · Una fila por bloque · No se muestran pacientes ni citas individuales.</p>
      </section>

      <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p><strong className="font-medium text-foreground">Programación no es lo mismo que disponibilidad para citas.</strong> Estos bloques no indican horas libres ni ocupación.</p>
          <p>Propuesta pendiente de validación: definición de turnos, plantilla del cliente, ausencias y programación histórica. No se aplica una división mañana/tarde sin acordar sus límites.</p>
        </div>
      </div>
    </div>
  );
}
