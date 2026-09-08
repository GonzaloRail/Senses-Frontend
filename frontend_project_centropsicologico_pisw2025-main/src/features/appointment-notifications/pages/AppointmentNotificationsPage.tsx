import { useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  MessageCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type AppointmentReminder,
  type AppointmentReminderChannel,
  type AppointmentReminderStatus,
} from "../api/appointmentNotificationsApi";
import { useAppointmentRemindersQuery } from "../hooks/useAppointmentRemindersQuery";

const channelLabels: Record<AppointmentReminderChannel, string> = {
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
};

const statusLabels: Record<AppointmentReminderStatus, string> = {
  PENDING: "Pendiente de envio",
  CLAIMED: "En proceso",
  SENDING: "Enviando",
  ACCEPTED: "Aceptado por proveedor",
  DELIVERED: "Entregado",
  UNDELIVERABLE: "No entregable",
  SIMULATED: "Simulado",
  CANCELED: "Cancelado",
  SKIPPED: "Omitido",
  FAILED: "Fallido",
  UNKNOWN: "Estado por confirmar",
};

const statusClasses: Record<AppointmentReminderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  CLAIMED: "bg-blue-50 text-blue-800 border-blue-200",
  SENDING: "bg-blue-50 text-blue-800 border-blue-200",
  ACCEPTED: "bg-cyan-50 text-cyan-800 border-cyan-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  UNDELIVERABLE: "bg-red-50 text-red-700 border-red-200",
  SIMULATED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELED: "bg-slate-100 text-slate-700 border-slate-200",
  SKIPPED: "bg-slate-100 text-slate-700 border-slate-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  UNKNOWN: "bg-orange-50 text-orange-800 border-orange-200",
};

function formatDate(value: string | null) {
  if (!value) return "No disponible";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

function reminderLabel(leadMinutes: number) {
  if (leadMinutes === 1440) return "24 horas antes";
  if (leadMinutes === 120) return "2 horas antes";
  if (leadMinutes === 60) return "1 hora antes";
  return `${leadMinutes} minutos antes`;
}

function patientName(reminder: AppointmentReminder) {
  const { firstName, lastName } = reminder.appointment.patient;
  return `${firstName} ${lastName}`;
}

function professionalName(reminder: AppointmentReminder) {
  const { firstName, lastName } = reminder.appointment.user;
  return `${firstName} ${lastName}`;
}

const StatusBadge = ({ status }: { status: AppointmentReminderStatus }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>
    {statusLabels[status]}
  </span>
);

export const AppointmentNotificationsPage = () => {
  const { data: reminders = [], error, isLoading, dataUpdatedAt, refetch, isRefetching } = useAppointmentRemindersQuery();
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<"" | AppointmentReminderChannel>("");
  const [status, setStatus] = useState<"" | AppointmentReminderStatus>("");
  const [selected, setSelected] = useState<AppointmentReminder | null>(null);

  const filtered = reminders.filter((reminder) => {
    const term = search.trim().toLowerCase();
    const location = `${reminder.appointment.office.location.name} / ${reminder.appointment.office.name}`;
    return (
      (!term || [patientName(reminder), professionalName(reminder), location, reminder.recipient ?? ""].join(" ").toLowerCase().includes(term)) &&
      (!channel || reminder.channel === channel) &&
      (!status || reminder.status === status)
    );
  });
  const pending = reminders.filter((item) => ["PENDING", "CLAIMED", "SENDING"].includes(item.status)).length;
  const delivered = reminders.filter((item) => item.status === "DELIVERED").length;
  const incidents = reminders.filter((item) => ["FAILED", "UNDELIVERABLE", "UNKNOWN", "SKIPPED"].includes(item.status)).length;

  return <>
    <SiteHeader title="Recordatorios de citas" />
    <main className="space-y-6 p-4 lg:p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-senses-secondary">WhatsApp y SMS</p>
          <h2 className="text-2xl font-semibold tracking-tight text-senses-primary">Seguimiento de notificaciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">Estados e historial registrados por el sistema de mensajeria.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{dataUpdatedAt ? `Actualizado: ${formatDate(new Date(dataUpdatedAt).toISOString())}` : "Sin datos"}</span>
          <Button variant="outline" onClick={() => void refetch()} disabled={isRefetching} className="cursor-pointer">
            <RefreshCw className={`mr-2 size-4 ${isRefetching ? "animate-spin" : ""}`} />Actualizar
          </Button>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><XCircle className="mr-2 inline size-4" />No se pudieron cargar los recordatorios. El endpoint de recordatorios debe estar disponible para mostrar datos reales.</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Pendientes de envio" value={pending} icon={<CalendarClock className="size-5" />} tone="text-senses-primary" />
        <SummaryCard label="Entregados" value={delivered} icon={<CheckCircle2 className="size-5" />} tone="text-emerald-600" />
        <SummaryCard label="Recordatorios" value={reminders.length} icon={<Clock3 className="size-5" />} tone="text-amber-600" />
        <SummaryCard label="Con incidencias" value={incidents} icon={<AlertCircle className="size-5" />} tone="text-red-600" />
      </section>

      <Card className="border-senses-secondary/20 shadow-sm">
        <CardContent className="p-0">
          <div className="grid gap-3 border-b p-4 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar paciente, profesional o telefono..." aria-label="Buscar recordatorios" />
            <select value={channel} onChange={(event) => setChannel(event.target.value as "" | AppointmentReminderChannel)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Todos los canales</option>
              {Object.entries(channelLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value as "" | AppointmentReminderStatus)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-4">Cita</th><th className="p-4">Paciente</th><th className="p-4">Profesional / sede</th><th className="p-4">Destinatario</th><th className="p-4">Recordatorio</th><th className="p-4">Canal</th><th className="p-4">Estado</th><th className="p-4 text-center">Acciones</th></tr></thead>
              <tbody>{filtered.map((reminder) => <tr key={reminder.id} className="border-t transition-colors hover:bg-senses-secondary/5"><td className="p-4 font-medium text-senses-primary">{formatDate(reminder.appointment.startDate)}</td><td className="p-4 font-medium">{patientName(reminder)}</td><td className="p-4"><p>{professionalName(reminder)}</p><p className="text-xs text-muted-foreground">{reminder.appointment.office.location.name} / {reminder.appointment.office.name}</p></td><td className="p-4 text-senses-primary">{reminder.recipient ?? "No registrado"}</td><td className="p-4">{reminderLabel(reminder.leadMinutes)}</td><td className="p-4">{channelLabels[reminder.channel]}</td><td className="p-4"><StatusBadge status={reminder.status} /></td><td className="p-4 text-center"><Button variant="ghost" size="icon" className="cursor-pointer text-senses-primary hover:bg-senses-secondary/10" onClick={() => setSelected(reminder)} aria-label={`Ver detalle de ${patientName(reminder)}`}><Eye className="size-4" /></Button></td></tr>)}</tbody>
            </table>
          </div>
          {isLoading ? <div className="py-14 text-center text-sm text-muted-foreground"><RefreshCw className="mx-auto mb-3 size-7 animate-spin text-senses-secondary" />Cargando recordatorios...</div> : !filtered.length && <div className="py-14 text-center text-sm text-muted-foreground"><MessageCircle className="mx-auto mb-3 size-8 text-senses-secondary" />No hay recordatorios para los filtros actuales.</div>}
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">Mostrando {filtered.length} de {reminders.length} recordatorios. Zona horaria: America/Lima.</div>
        </CardContent>
      </Card>
    </main>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="max-w-3xl">
        {selected && <><DialogHeader><DialogTitle className="text-senses-primary">Detalle de recordatorio</DialogTitle><DialogDescription>{channelLabels[selected.channel]} · {reminderLabel(selected.leadMinutes)}</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><DetailField label="Paciente" value={patientName(selected)} detail={selected.recipient ?? "Numero no registrado"} /><DetailField label="Cita" value={formatDate(selected.appointment.startDate)} detail={professionalName(selected)} /><DetailField label="Sede / consultorio" value={`${selected.appointment.office.location.name} / ${selected.appointment.office.name}`} /><DetailField label="Estado" value={statusLabels[selected.status]} detail={`Programado: ${formatDate(selected.scheduledAt)}`} /><DetailField label="Envio" value={formatDate(selected.acceptedAt)} detail={`Intentos: ${selected.attempts}`} /><DetailField label="Entrega" value={formatDate(selected.deliveredAt)} detail={selected.providerStatus ?? "Sin respuesta de entrega"} /></div>{selected.lastError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Incidencia: {selected.lastError}</div>}<div className="rounded-lg border border-senses-secondary/30 bg-senses-secondary/10 p-3 text-sm text-senses-primary">Proveedor: {selected.provider ?? "No asignado"}</div></>}
      </DialogContent>
    </Dialog>
  </>;
};

const SummaryCard = ({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) => <Card className="border-senses-secondary/20"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></div><span className={`${tone} rounded-full bg-muted p-2.5`}>{icon}</span></CardContent></Card>;
const DetailField = ({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) => <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-1 text-sm font-medium">{value}</div>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>;
