import { useState } from "react";
import { CalendarCheck2, CheckCircle2, CircleAlert, Clock3, MapPin, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfirmationSnapshot {
  appointmentId: string;
  patient: string;
  professional: string;
  appointmentDate: string;
  location: string;
  confirmationStatus: "PENDING" | "CONFIRMED";
}

const confirmationStorageKey = "senses-appointment-confirmations";

function getSnapshot(id: string | undefined): ConfirmationSnapshot | null {
  if (!id) return null;
  try {
    const snapshots = JSON.parse(localStorage.getItem(confirmationStorageKey) ?? "{}") as Record<string, ConfirmationSnapshot>;
    return snapshots[id] ?? null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "full", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(value));
}

export const AppointmentConfirmationPage = () => {
  const { token } = useParams<{ token: string }>();
  const [appointment, setAppointment] = useState(() => getSnapshot(token));

  const confirm = () => {
    if (!appointment || !token) return;
    const confirmed = { ...appointment, confirmationStatus: "CONFIRMED" as const };
    const snapshots = JSON.parse(localStorage.getItem(confirmationStorageKey) ?? "{}") as Record<string, ConfirmationSnapshot>;
    localStorage.setItem(confirmationStorageKey, JSON.stringify({ ...snapshots, [token]: confirmed }));
    setAppointment(confirmed);
  };

  if (!appointment) return <ConfirmationCard icon={<CircleAlert className="size-10 text-red-600" />} title="Enlace no disponible" description="Este enlace no contiene información de una cita disponible en este navegador. La confirmación pública se conectará cuando el backend habilite el enlace seguro." />;
  if (appointment.confirmationStatus === "CONFIRMED") return <ConfirmationCard icon={<CheckCircle2 className="size-10 text-emerald-600" />} title="Cita confirmada" description={`Gracias, ${appointment.patient}. Registramos tu confirmación de asistencia.`} detail={formatDate(appointment.appointmentDate)} />;

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><Card className="w-full max-w-lg border-senses-secondary/30 shadow-lg"><CardHeader className="border-b bg-senses-primary text-white"><p className="text-sm font-medium text-senses-secondary">Senses Psicólogos</p><CardTitle className="text-2xl text-white">Confirma tu asistencia</CardTitle><CardDescription className="text-slate-200">Revisa los datos de tu cita antes de confirmar.</CardDescription></CardHeader><CardContent className="space-y-5 p-6"><div className="rounded-lg bg-senses-secondary/10 p-4"><p className="font-semibold text-senses-primary">Hola, {appointment.patient}</p><p className="mt-1 text-sm text-muted-foreground">Tu cita está pendiente de confirmación.</p></div><div className="space-y-4 text-sm"><Info icon={<CalendarCheck2 />} label="Fecha y hora" value={formatDate(appointment.appointmentDate)} /><Info icon={<UserRound />} label="Profesional" value={appointment.professional} /><Info icon={<MapPin />} label="Sede y consultorio" value={appointment.location} /><Info icon={<Clock3 />} label="Estado" value="Pendiente de confirmación" /></div><Button onClick={confirm} className="w-full cursor-pointer bg-senses-primary py-5 text-base hover:bg-senses-primary/90"><CheckCircle2 className="mr-2 size-5" />Confirmar asistencia</Button><p className="text-center text-xs text-muted-foreground">La confirmación se guarda localmente hasta que el backend publique el enlace seguro para pacientes.</p></CardContent></Card></main>;
};

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => <div className="flex gap-3"><span className="text-senses-secondary">{icon}</span><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="font-medium text-foreground">{value}</p></div></div>;
const ConfirmationCard = ({ icon, title, description, detail }: { icon: React.ReactNode; title: string; description: string; detail?: string }) => <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><Card className="w-full max-w-md border-senses-secondary/30 text-center shadow-lg"><CardContent className="space-y-4 p-8"><div className="flex justify-center">{icon}</div><h1 className="text-2xl font-semibold text-senses-primary">{title}</h1><p className="text-sm leading-6 text-muted-foreground">{description}</p>{detail && <p className="rounded-lg bg-senses-secondary/10 p-3 text-sm font-medium text-senses-primary">{detail}</p>}</CardContent></Card></main>;
