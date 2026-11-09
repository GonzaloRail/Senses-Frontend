import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { attendanceError, createNonWorkingDay, deleteNonWorkingDay, getAttendancePolicy, getNonWorkingDays, updateAttendancePolicy, type AttendancePolicy } from "../api/attendanceApi";
import { AttendanceTable } from "./AttendanceTable";

const numericFields = [
  { key: "lateToleranceMinutes", label: "Tolerancia de entrada (min)", min: 0, max: 60 },
  { key: "earlyLeaveToleranceMinutes", label: "Tolerancia de salida (min)", min: 0, max: 60 },
  { key: "antiDoublePunchSeconds", label: "Tiempo entre marcajes (seg)", min: 5, max: 300 },
  { key: "undoWindowMinutes", label: "Plazo para deshacer (min)", min: 1, max: 30 },
] as const;

function PolicyForm({ policy }: { policy: AttendancePolicy }) {
  const [draft, setDraft] = useState(policy);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateAttendancePolicy,
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["attendance", "policy"] }); },
  });
  return (
    <form className="space-y-4 rounded-lg border p-4" onSubmit={(event) => {
      event.preventDefault();
      if (!mutation.isPending) mutation.mutate(draft);
    }}>
      <h2 className="font-semibold">Política de asistencia</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {numericFields.map(({ key, label, min, max }) => <Label key={key} className="flex-col items-start">{label}
          <Input required type="number" min={min} max={max} value={Number.isNaN(draft[key]) ? "" : draft[key]} onChange={(event) => {
            const value = event.target.valueAsNumber;
            setDraft((previous) => ({ ...previous, [key]: value }));
          }} />
        </Label>)}
        <Label className="flex-col items-start">Hora de cierre en Lima
          <Input required type="time" value={draft.dailyCloseTime} onChange={(event) => {
            const dailyCloseTime = event.target.value;
            setDraft((previous) => ({ ...previous, dailyCloseTime }));
          }} />
        </Label>
      </div>
      {mutation.isError && <p role="alert" className="text-destructive">{attendanceError(mutation.error, "No se pudo guardar la política.")}</p>}
      {mutation.isSuccess && <p role="status">Política guardada.</p>}
      <Button disabled={mutation.isPending}>Guardar política</Button>
    </form>
  );
}

export function AttendanceSettings() {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const client = useQueryClient();
  const policy = useQuery({ queryKey: ["attendance", "policy"], queryFn: ({ signal }) => getAttendancePolicy(signal), retry: false });
  const days = useQuery({ queryKey: ["attendance", "non-working-days"], queryFn: ({ signal }) => getNonWorkingDays(signal), retry: false });
  const refresh = () => { void client.invalidateQueries({ queryKey: ["attendance"] }); };
  const create = useMutation({
    mutationFn: (input: { date: string; description: string }) => createNonWorkingDay(input.date, input.description),
    onSuccess: () => { setDate(""); setDescription(""); refresh(); },
  });
  const remove = useMutation({ mutationFn: deleteNonWorkingDay, onSuccess: refresh });
  return (
    <div className="space-y-4">
      {policy.isPending && <p>Cargando política…</p>}
      {policy.isError && <p role="alert" className="text-destructive">No se pudo cargar la política.</p>}
      {policy.data && <PolicyForm policy={policy.data} />}
      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-semibold">Días no laborables</h2>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
          event.preventDefault();
          if (date && description.trim() && !create.isPending) create.mutate({ date, description: description.trim() });
        }}>
          <Label className="flex-col items-start">Fecha
            <Input required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Label>
          <Label className="flex-col items-start">Motivo
            <Input required value={description} onChange={(event) => setDescription(event.target.value)} />
          </Label>
          <Button disabled={create.isPending}>Agregar día</Button>
        </form>
        {days.isPending && <p>Cargando días…</p>}
        {days.isError && <p role="alert" className="text-destructive">No se pudieron cargar los días no laborables.</p>}
        {create.isError && <p role="alert" className="text-destructive">{attendanceError(create.error, "No se pudo agregar el día.")}</p>}
        {remove.isError && <p role="alert" className="text-destructive">{attendanceError(remove.error, "No se pudo retirar el día.")}</p>}
        {days.data && <AttendanceTable headers={["Fecha", "Motivo", "Acción"]} rows={days.data.map((day) => ({
          id: day.id,
          cells: [day.date, day.description, <Button variant="outline" size="sm" disabled={remove.isPending} onClick={() => {
            if (window.confirm(`¿Retirar el día no laborable del ${day.date}?`)) remove.mutate(day.id);
          }}>Retirar</Button>],
        }))} />}
      </section>
      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="font-semibold">Personal que registra asistencia</h2>
        <p className="text-sm text-muted-foreground">Consulta el indicador de asistencia en la lista de usuarios y configúralo en la ficha de cada persona.</p>
        <Button asChild variant="outline"><Link to="/system-users">Ir a usuarios</Link></Button>
      </section>
    </div>
  );
}
