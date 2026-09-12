import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, Eye, MessageCircle, RefreshCw, Send, Settings2, XCircle } from "lucide-react";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppointmentByIdApi } from "@/features/appointments/api/appointmentsApi";
import { getAppointmentRemindersApi, type AppointmentReminder } from "../api/appointmentRemindersApi";
import { getPatientByIdApi } from "@/features/patients/api/patientsApi";
import type { AppointmentViewResponse } from "@/shared/interfaces/apiResponses/getAppointmentByIdResponse";

type NotificationType = "24_HOURS" | "1_HOUR";
type NotificationStatus = "SCHEDULED" | "PROCESSING" | "ACCEPTED" | "DELIVERED" | "CANCELLED" | "NOT_AVAILABLE" | "CONFIRMED" | "SENT";

interface ConfirmationSnapshot {
  appointmentId: string;
  patient: string;
  professional: string;
  appointmentDate: string;
  location: string;
  confirmationStatus: "PENDING" | "CONFIRMED";
}

interface AppointmentNotification extends ConfirmationSnapshot {
  id: string;
  phone: string;
  channel: "SMS" | "WHATSAPP";
  type: NotificationType;
  scheduledAt: string;
  status: NotificationStatus;
  message: string;
  confirmationUrl?: string;
  detail: string;
}

interface PatientContactResponse {
  phoneNumber?: string;
}

const typeLabels: Record<NotificationType, string> = { "24_HOURS": "24 horas antes", "1_HOUR": "1 hora antes" };
const statusLabels: Record<NotificationStatus, string> = { SCHEDULED: "Pendiente de envío", PROCESSING: "Procesando", ACCEPTED: "Aceptado por proveedor", DELIVERED: "Entregado", CANCELLED: "Cancelado", NOT_AVAILABLE: "No disponible", CONFIRMED: "Confirmado", SENT: "Enviado" };
const statusClasses: Record<NotificationStatus, string> = { SCHEDULED: "bg-amber-50 text-amber-800 border-amber-200", PROCESSING: "bg-blue-50 text-blue-800 border-blue-200", ACCEPTED: "bg-blue-50 text-blue-800 border-blue-200", DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200", CANCELLED: "bg-slate-100 text-slate-700 border-slate-200", NOT_AVAILABLE: "bg-red-50 text-red-700 border-red-200", CONFIRMED: "bg-emerald-50 text-emerald-800 border-emerald-200", SENT: "bg-blue-50 text-blue-800 border-blue-200" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(value));
}

function mapReminderStatus(reminder: AppointmentReminder): NotificationStatus {
  if (["PENDING", "CLAIMED"].includes(reminder.status)) return "SCHEDULED";
  if (reminder.status === "SENDING") return "PROCESSING";
  if (reminder.status === "ACCEPTED" || reminder.status === "SIMULATED") return "ACCEPTED";
  if (reminder.status === "DELIVERED") return "DELIVERED";
  if (reminder.status === "CANCELED") return "CANCELLED";
  return "NOT_AVAILABLE";
}

function createNotification(appointment: AppointmentViewResponse, phone: string, reminder: AppointmentReminder): AppointmentNotification {
  const patient = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
  const professional = `${appointment.user.firstName} ${appointment.user.lastName}`;
  const location = `${appointment.office.location.name} / ${appointment.office.name}`;
  const appointmentDate = appointment.startDate;
  const type: NotificationType = reminder.leadMinutes === 1440 ? "24_HOURS" : "1_HOUR";
  const confirmationUrl = `/confirmar-cita/${appointment.id}`;
  const hasPhone = phone.trim().length >= 9;
  return {
    id: reminder.id,
    appointmentId: appointment.id,
    appointmentDate,
    patient,
    professional,
    location,
    phone: hasPhone ? phone : "No registrado",
    channel: reminder.channel,
    type,
    scheduledAt: reminder.scheduledAt,
    status: hasPhone ? mapReminderStatus(reminder) : "NOT_AVAILABLE",
    confirmationStatus: reminder.appointment.confirmedAt && reminder.appointment.confirmedVersion === reminder.version ? "CONFIRMED" : "PENDING",
    message: `Hola, ${patient}.\n\nTe recordamos tu cita para el ${formatDate(appointmentDate)} con ${professional}, en ${location}.\n\nConfirma tu asistencia en el siguiente enlace:`,
    confirmationUrl,
    detail: hasPhone ? `Canal: ${reminder.channel}. Intentos: ${reminder.attempts}.` : "El paciente no tiene un número de teléfono válido registrado.",
  };
}

async function loadNotifications(): Promise<AppointmentNotification[]> {
  const { data: reminders } = await getAppointmentRemindersApi({ page: 1, take: 100 });
  const appointmentIds = [...new Set(reminders.map((reminder) => reminder.appointmentId))];
  const details = await Promise.all(appointmentIds.map(async (appointmentId) => {
    const appointment = await getAppointmentByIdApi(appointmentId) as AppointmentViewResponse;
    const patient = await getPatientByIdApi({ id: appointment.patient.id }) as PatientContactResponse;
    return [appointmentId, { appointment, phone: patient.phoneNumber ?? "" }] as const;
  }));
  const byAppointment = new Map(details);
  return reminders
    .flatMap((reminder) => {
      const detail = byAppointment.get(reminder.appointmentId);
      return detail ? [createNotification(detail.appointment, detail.phone, reminder)] : [];
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

const StatusBadge = ({ status }: { status: NotificationStatus }) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>{statusLabels[status]}</span>;

export const AppointmentNotificationsPage = () => {
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"" | NotificationType>("");
  const [status, setStatus] = useState<"" | NotificationStatus>("");
  const [selected, setSelected] = useState<AppointmentNotification | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [firstReminder, setFirstReminder] = useState(24);
  const [secondReminder, setSecondReminder] = useState(1);
  const [firstEnabled, setFirstEnabled] = useState(true);
  const [secondEnabled, setSecondEnabled] = useState(true);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setNotifications(await loadNotifications());
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("No se pudieron cargar las citas y los datos de pacientes. Intenta actualizar nuevamente.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = notifications.filter((notification) => {
    const term = search.trim().toLowerCase();
    const matchesStatus = status === "CONFIRMED"
      ? notification.confirmationStatus === "CONFIRMED"
      : status === "SENT"
        ? ["ACCEPTED", "DELIVERED"].includes(notification.status)
        : !status || notification.status === status;
    return (!term || [notification.patient, notification.professional, notification.location, notification.phone].join(" ").toLowerCase().includes(term)) && (!type || notification.type === type) && matchesStatus;
  });
  const pending = notifications.filter((item) => item.status === "SCHEDULED").length;
  const unavailable = notifications.filter((item) => item.status === "NOT_AVAILABLE").length;
  const confirmedAppointments = new Set(notifications.filter((item) => item.confirmationStatus === "CONFIRMED").map((item) => item.appointmentId)).size;

  const saveSettings = () => setSettingsOpen(false);

  return <><SiteHeader title="Recordatorios de citas" /><main className="space-y-6 p-4 lg:p-6">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-medium text-senses-secondary">WhatsApp</p><h2 className="text-2xl font-semibold tracking-tight text-senses-primary">Seguimiento de notificaciones</h2><p className="mt-1 text-sm text-muted-foreground">Datos de citas, pacientes y profesionales cargados desde el sistema.</p></div><div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">{lastUpdated ? `Actualizado: ${formatDate(lastUpdated.toISOString())}` : "Cargando..."}</span><Button variant="outline" onClick={() => void refresh()} disabled={refreshing} className="cursor-pointer"><RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />Actualizar</Button><Button onClick={() => setSettingsOpen(true)} className="cursor-pointer bg-senses-primary hover:bg-senses-primary/90"><Settings2 className="mr-2 size-4" />Configuración</Button></div></section>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><XCircle className="mr-2 inline size-4" />{error}</div>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard label="Notificaciones pendientes" value={pending} icon={<CalendarClock className="size-5" />} tone="text-senses-primary" /><SummaryCard label="Citas confirmadas" value={confirmedAppointments} icon={<CheckCircle2 className="size-5" />} tone="text-emerald-600" /><SummaryCard label="Próximos envíos" value={notifications.length} icon={<Clock3 className="size-5" />} tone="text-amber-600" /><SummaryCard label="Sin WhatsApp válido" value={unavailable} icon={<AlertCircle className="size-5" />} tone="text-red-600" /></section>
    <Card className="border-senses-secondary/20 shadow-sm"><CardContent className="p-0"><div className="grid gap-3 border-b p-4 lg:grid-cols-[minmax(0,1fr)_200px_200px]"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar paciente, profesional o teléfono..." aria-label="Buscar notificaciones" /><select value={type} onChange={(event) => setType(event.target.value as "" | NotificationType)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Todos los tipos</option><option value="24_HOURS">24 horas antes</option><option value="1_HOUR">1 hora antes</option></select><select value={status} onChange={(event) => setStatus(event.target.value as "" | NotificationStatus)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-4">Cita</th><th className="p-4">Paciente</th><th className="p-4">Profesional / sede</th><th className="p-4">Canal</th><th className="p-4">Notificación</th><th className="p-4">Confirmación</th><th className="p-4">Estado</th><th className="p-4 text-center">Acciones</th></tr></thead><tbody>{filtered.map((notification) => <tr key={notification.id} className="border-t transition-colors hover:bg-senses-secondary/5"><td className="p-4 font-medium text-senses-primary">{formatDate(notification.appointmentDate)}</td><td className="p-4 font-medium">{notification.patient}</td><td className="p-4"><p>{notification.professional}</p><p className="text-xs text-muted-foreground">{notification.location}</p></td><td className="p-4 text-senses-primary">{notification.channel}</td><td className="p-4">{typeLabels[notification.type]}</td><td className="p-4">{notification.confirmationStatus === "CONFIRMED" ? <span className="font-medium text-emerald-700">Confirmada</span> : "Pendiente"}</td><td className="p-4"><StatusBadge status={notification.status} /></td><td className="p-4 text-center"><Button variant="ghost" size="icon" className="cursor-pointer text-senses-primary hover:bg-senses-secondary/10" onClick={() => setSelected(notification)} aria-label={`Ver detalle de ${notification.patient}`}><Eye className="size-4" /></Button></td></tr>)}</tbody></table></div>{refreshing && !notifications.length ? <div className="py-14 text-center text-sm text-muted-foreground"><RefreshCw className="mx-auto mb-3 size-7 animate-spin text-senses-secondary" />Cargando citas reales...</div> : !filtered.length && <div className="py-14 text-center text-sm text-muted-foreground"><MessageCircle className="mx-auto mb-3 size-8 text-senses-secondary" />No hay notificaciones para las citas y filtros actuales.</div>}<div className="border-t px-4 py-3 text-xs text-muted-foreground">Mostrando {filtered.length} de {notifications.length} notificaciones. Zona horaria: Arequipa (America/Lima).</div></CardContent></Card>
  </main>
  <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">{selected && <><DialogHeader><DialogTitle className="text-senses-primary">Detalle de notificación</DialogTitle><DialogDescription>WhatsApp · {typeLabels[selected.type]}</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><DetailField label="Paciente" value={selected.patient} detail={selected.phone} /><DetailField label="Cita" value={formatDate(selected.appointmentDate)} detail={selected.professional} /><DetailField label="Sede / consultorio" value={selected.location} /><DetailField label="Confirmación de cita" value={selected.confirmationStatus === "CONFIRMED" ? "Confirmada" : "Pendiente"} detail={`Programado: ${formatDate(selected.scheduledAt)}`} /></div><section><h3 className="mb-2 text-sm font-semibold text-senses-primary">Mensaje programado</h3><div className="whitespace-pre-line rounded-lg border bg-muted/30 p-4 text-sm leading-6">{selected.message}{selected.confirmationUrl && <><br /><a href={selected.confirmationUrl} className="font-medium text-senses-primary underline underline-offset-2">{selected.confirmationUrl}</a></>}</div></section><div className="rounded-lg border border-senses-secondary/30 bg-senses-secondary/10 p-3 text-sm text-senses-primary">{selected.detail}</div><DialogFooter><Button variant="outline" onClick={() => setSelected(null)} className="cursor-pointer">Cerrar</Button><Button disabled className="bg-senses-primary/60"><Send className="mr-2 size-4" />Reenviar al conectar WhatsApp</Button></DialogFooter></>}</DialogContent></Dialog>
  <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent><DialogHeader><DialogTitle className="text-senses-primary">Configuración de recordatorios</DialogTitle><DialogDescription>La planificación activa se define en el backend: 24 horas y 1 hora antes de cada cita.</DialogDescription></DialogHeader><div className="space-y-5 py-2"><ReminderInput label="Primer recordatorio" enabled={firstEnabled} hours={firstReminder} onEnabledChange={setFirstEnabled} onHoursChange={setFirstReminder} /><ReminderInput label="Segundo recordatorio" enabled={secondEnabled} hours={secondReminder} onEnabledChange={setSecondEnabled} onHoursChange={setSecondReminder} /><div className="rounded-lg bg-senses-secondary/10 p-3 text-sm text-senses-primary"><MessageCircle className="mr-2 inline size-4" />Canales configurados en backend: SMS y WhatsApp.</div></div><DialogFooter><Button variant="outline" onClick={() => setSettingsOpen(false)} className="cursor-pointer">Cerrar</Button><Button onClick={saveSettings} className="cursor-pointer bg-senses-primary hover:bg-senses-primary/90">Entendido</Button></DialogFooter></DialogContent></Dialog>
  </>;
};

const SummaryCard = ({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) => <Card className="border-senses-secondary/20"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></div><span className={`${tone} rounded-full bg-muted p-2.5`}>{icon}</span></CardContent></Card>;
const DetailField = ({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) => <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-1 text-sm font-medium">{value}</div>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>;
const ReminderInput = ({ label, enabled, hours, onEnabledChange }: { label: string; enabled: boolean; hours: number; onEnabledChange: (value: boolean) => void; onHoursChange?: (value: number) => void }) => <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3"><input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} aria-label={label} className="size-4 accent-[#0B2035]" /><div className="flex-1"><Label>{label}</Label><p className="text-xs text-muted-foreground">Puedes activar o desactivar este recordatorio</p></div><Input type="number" value={hours} disabled readOnly className="w-20" /><span className="text-sm text-muted-foreground">horas</span></div>;
