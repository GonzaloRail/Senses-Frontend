import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { attendanceError, createManualPunch, getAttendanceRecords, sourceLabels, voidAttendanceRecord, type PunchSource } from "../api/attendanceApi";
import { AttendancePersonFilter } from "./AttendancePersonFilter";
import { AttendanceReasonForm } from "./AttendanceReasonForm";
import { AttendanceTable } from "./AttendanceTable";
import { attendanceTime } from "../utils/attendanceTime";

const limaDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" });

function ManualPunchForm({ onClose }: { onClose: () => void }) {
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [localTime, setLocalTime] = useState("");
  const [reason, setReason] = useState("");
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: createManualPunch,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["attendance"] });
      onClose();
    },
  });
  return (
    <form className="space-y-3 rounded-lg border p-4" onSubmit={(event) => {
      event.preventDefault();
      if (!userId || !localTime || reason.trim().length < 10 || mutation.isPending) return;
      const date = new Date(`${localTime}-05:00`);
      if (!Number.isNaN(date.valueOf())) mutation.mutate({ userId, type, punchedAt: date.toISOString(), reason: reason.trim() });
    }}>
      <h3 className="font-semibold">Marcaje manual</h3>
      <AttendancePersonFilter required value={userId} onChange={setUserId} />
      <Label className="flex-col items-start">Tipo
        <select className="h-9 rounded-md border bg-background px-2" value={type} onChange={(event) => setType(event.target.value === "OUT" ? "OUT" : "IN")}>
          <option value="IN">Entrada</option><option value="OUT">Salida</option>
        </select>
      </Label>
      <Label className="flex-col items-start">Fecha y hora de Lima
        <Input type="datetime-local" required value={localTime} onChange={(event) => setLocalTime(event.target.value)} />
      </Label>
      <Label className="flex-col items-start">Motivo (mínimo 10 caracteres)
        <Textarea required minLength={10} value={reason} onChange={(event) => setReason(event.target.value)} />
      </Label>
      {mutation.isError && <p role="alert" className="text-destructive">{attendanceError(mutation.error, "No se pudo registrar el marcaje.")}</p>}
      <div className="flex gap-2">
        <Button disabled={mutation.isPending}>Guardar marcaje</Button>
        <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

export function AttendanceRecords() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userId, setUserId] = useState("");
  const [source, setSource] = useState<PunchSource | "">("");
  const [includeVoided, setIncludeVoided] = useState(false);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ type: "manual" } | { type: "void"; id: string; label: string }>();
  const validRange = !from || !to || from <= to;
  const filters = { from: from || undefined, to: to || undefined, userId: userId || undefined, source: source || undefined, includeVoided, page };
  const query = useQuery({
    queryKey: ["attendance", "records", filters],
    queryFn: ({ signal }) => getAttendanceRecords(filters, signal),
    enabled: validRange,
    retry: false,
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Label className="flex-col items-start self-start">Desde
          <Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
        </Label>
        <Label className="flex-col items-start self-start">Hasta
          <Input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
        </Label>
        <AttendancePersonFilter value={userId} onChange={(id) => { setUserId(id); setPage(1); }} />
        <Label className="flex-col items-start self-start">Origen
          <select className="h-9 w-full rounded-md border bg-background px-2" value={source} onChange={(event) => {
            setSource(event.target.value as PunchSource | "");
            setPage(1);
          }}>
            <option value="">Todos</option>
            {Object.entries(sourceLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </Label>
        <Label><input type="checkbox" checked={includeVoided} onChange={(event) => { setIncludeVoided(event.target.checked); setPage(1); }} /> Incluir anulados</Label>
      </div>
      {!validRange && <p role="alert" className="text-destructive">La fecha inicial debe ser igual o anterior a la final.</p>}
      <Button variant="outline" disabled={Boolean(action)} onClick={() => setAction({ type: "manual" })}>Marcaje manual</Button>
      {action?.type === "manual" && <ManualPunchForm onClose={() => setAction(undefined)} />}
      {action?.type === "void" && <AttendanceReasonForm key={action.id} title={`Anular marcaje de ${action.label}`} save={(reason) => voidAttendanceRecord(action.id, reason)} onClose={() => setAction(undefined)} />}
      {validRange && query.isPending && <p>Cargando registros…</p>}
      {query.isError && <p role="alert" className="text-destructive">{attendanceError(query.error, "No se pudieron cargar los registros.")}</p>}
      {query.data && (
        <>
          <AttendanceTable headers={["Persona", "Fecha y hora de Lima", "Tipo", "Origen", "Estado", "Acción"]} rows={query.data.records.map((entry) => {
            const name = `${entry.user.firstName} ${entry.user.lastName}`;
            return {
              id: entry.id,
              cells: [name, `${limaDate.format(new Date(entry.punchedAt))} ${attendanceTime(entry.punchedAt)}`, entry.type === "IN" ? "Entrada" : "Salida", sourceLabels[entry.source], entry.voidedAt ? "Anulado" : "Vigente",
                !entry.voidedAt && <Button variant="outline" size="sm" disabled={Boolean(action)} onClick={() => setAction({ type: "void", id: entry.id, label: name })}>Anular</Button>],
            };
          })} />
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="text-sm">Página {page} de {Math.max(1, query.data.totalPages)}</span>
            <Button variant="outline" disabled={page >= query.data.totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </div>
        </>
      )}
    </div>
  );
}
