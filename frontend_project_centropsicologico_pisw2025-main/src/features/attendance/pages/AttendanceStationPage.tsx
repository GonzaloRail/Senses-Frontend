import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { attendanceError, attendanceLabels, getAttendanceToday, registerPunch, undoPunch, type Punch } from "../api/attendanceApi";

const todayKey = ["attendance", "today"] as const;
const clock = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const punchLabel = (type: Punch["record"]["type"]) => type === "IN" ? "Entrada" : "Salida";

export function AttendanceStationPage() {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const digitTimes = useRef<number[]>([]);
  const overflow = useRef(false);
  const busy = useRef(false);
  const [dni, setDni] = useState("");
  const [result, setResult] = useState<Punch>();
  const [message, setMessage] = useState<{ text: string; error: boolean }>();
  const [recent, setRecent] = useState<Punch[]>([]);
  const [undoRecordId, setUndoRecordId] = useState<string>();
  const [now, setNow] = useState(Date.now);

  const today = useQuery({
    queryKey: todayKey,
    queryFn: ({ signal }) => getAttendanceToday(signal),
    refetchInterval: 30_000,
    retry: false,
  });
  const serverOffset = today.data ? Date.parse(today.data.serverTime) - today.dataUpdatedAt : undefined;
  const serverNow = serverOffset === undefined ? undefined : now + serverOffset;

  useEffect(() => {
    const focus = () => input.current?.focus();
    focus();
    window.addEventListener("focus", focus);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.removeEventListener("focus", focus);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!result && !message) return;
    const timer = window.setTimeout(() => {
      setResult(undefined);
      setMessage(undefined);
    }, 9000);
    return () => window.clearTimeout(timer);
  }, [result, message]);

  const register = useMutation({
    mutationFn: registerPunch,
    retry: false,
    onSuccess: (punch) => {
      setResult(punch);
      setRecent((entries) => [punch, ...entries.filter(
        (entry) => entry.provisionalDay.date === punch.provisionalDay.date
      )].slice(0, 5));
      setUndoRecordId(punch.record.id);
      void queryClient.invalidateQueries({ queryKey: todayKey });
    },
    onError: (error) => setMessage({
      text: attendanceError(error, "No se pudo confirmar el marcaje. Revisa el panel de hoy antes de volver a marcar."),
      error: true,
    }),
    onSettled: () => {
      busy.current = false;
      input.current?.focus();
    },
  });

  const undo = useMutation({
    mutationFn: undoPunch,
    retry: false,
    onSuccess: (_, id) => {
      setRecent((entries) => entries.filter((entry) => entry.record.id !== id));
      setUndoRecordId(undefined);
      setMessage({ text: "Marcaje deshecho.", error: false });
      void queryClient.invalidateQueries({ queryKey: todayKey });
    },
    onError: (error) => setMessage({
      text: attendanceError(error, "No se pudo confirmar que el marcaje se haya deshecho."),
      error: true,
    }),
    onSettled: () => {
      busy.current = false;
      input.current?.focus();
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    setResult(undefined);
    if (overflow.current || dni.length !== 8) {
      setMessage({
        text: overflow.current ? "El DNI debe tener exactamente 8 dígitos." : "DNI incompleto. Ingresa 8 dígitos.",
        error: true,
      });
      if (overflow.current) {
        overflow.current = false;
        digitTimes.current = [];
        setDni("");
      }
      input.current?.focus();
      return;
    }
    const times = digitTimes.current;
    const isBarcode = times.length === 8 && times.slice(1).every((time, index) => time - times[index] < 50);
    busy.current = true;
    setMessage(undefined);
    digitTimes.current = [];
    setDni("");
    register.mutate({ dni, source: isBarcode ? "BARCODE" : "DNI_MANUAL" });
  };

  const recentToday = recent.filter((entry) => !today.data || entry.provisionalDay.date >= today.data.date);
  const latest = recentToday[0];
  const pending = today.data?.staff.filter((person) => person.status === "PENDIENTE") ?? [];
  const undoDeadline = latest ? Date.parse(latest.undoUntil) : 0;
  const isBusy = register.isPending || undo.isPending;

  return (
    <>
      <SiteHeader title="Marcaje de personal" />
      <main className="mx-auto w-full max-w-5xl space-y-5 p-4 lg:p-6">
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-3 sm:flex-row">
            <div>
              <CardTitle>Estación de recepción</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">Digita tu DNI o usa el lector y presiona Enter.</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold tabular-nums">{serverNow === undefined ? "—" : clock.format(serverNow)}</p>
              <p className="text-xs text-muted-foreground">Hora del servidor en Lima</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="flex flex-wrap items-end gap-3" onSubmit={submit}>
              <div className="min-w-40 flex-1">
                <Label htmlFor="attendance-dni">DNI</Label>
                <Input
                  ref={input}
                  id="attendance-dni"
                  inputMode="numeric"
                  autoComplete="off"
                  value={dni}
                  readOnly={isBusy}
                  className="mt-2 h-14 text-2xl tabular-nums"
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    overflow.current = digits.length > 8;
                    const next = digits.slice(0, 8);
                    event.target.value = next;
                    digitTimes.current = next.length === dni.length + 1 && next.startsWith(dni)
                      ? [...digitTimes.current, performance.now()]
                      : [];
                    setDni(next);
                  }}
                />
              </div>
              <Button type="submit" size="lg" disabled={isBusy}>
                {register.isPending ? "Registrando…" : "Marcar asistencia"}
              </Button>
            </form>

            {message && <p role={message.error ? "alert" : "status"} className={message.error ? "rounded-md bg-red-50 p-3 text-red-900" : "rounded-md bg-green-50 p-3 text-green-900"}>{message.text}</p>}
            {result && (
              <div role="status" className={result.provisionalDay.status === "PUNTUAL" ? "rounded-md bg-green-50 p-4 text-green-900" : "rounded-md bg-amber-50 p-4 text-amber-950"}>
                <p className="font-semibold">{punchLabel(result.record.type)} registrada · {clock.format(new Date(result.record.punchedAt))}</p>
                <p>{result.user.fullName} · {attendanceLabels[result.provisionalDay.status]} (provisional)</p>
                {result.provisionalDay.expectedStart && result.provisionalDay.expectedEnd && (
                  <p className="text-sm">Horario de hoy {result.provisionalDay.expectedStart}–{result.provisionalDay.expectedEnd}</p>
                )}
                {result.provisionalDay.lateMinutes > 0 && <p className="text-sm">{result.provisionalDay.lateMinutes} min de tardanza</p>}
                {result.provisionalDay.earlyLeaveMinutes > 0 && <p className="text-sm">{result.provisionalDay.earlyLeaveMinutes} min de salida anticipada</p>}
              </div>
            )}
            {latest && latest.record.id === undoRecordId && serverNow !== undefined && serverNow < undoDeadline && (
              <Button variant="outline" disabled={isBusy} onClick={() => {
                if (busy.current || serverOffset === undefined || Date.now() + serverOffset >= undoDeadline) return;
                busy.current = true;
                setMessage(undefined);
                setResult(undefined);
                undo.mutate(latest.record.id);
              }}>
                {undo.isPending ? "Deshaciendo…" : "Deshacer último marcaje"}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Últimos marcajes de esta sesión</CardTitle></CardHeader>
            <CardContent>
              {recentToday.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay marcajes en esta pantalla.</p> : (
                <ul className="divide-y text-sm">
                  {recentToday.map(({ record, user }) => (
                    <li key={record.id} className="flex flex-wrap justify-between gap-x-3 py-2">
                      <span>{user.fullName}</span>
                      <span>{punchLabel(record.type)} · {clock.format(new Date(record.punchedAt))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Personal sin marcaje hoy</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {today.isPending ? <p>Cargando…</p> : today.isError ? (
                <div className="space-y-2">
                  <p role="alert">No se pudo consultar la asistencia de hoy.</p>
                  <Button variant="outline" onClick={() => void today.refetch()}>Reintentar</Button>
                </div>
              ) : pending.length === 0 ? <p className="text-muted-foreground">No hay colaboradores sin marcaje en el panel de hoy.</p> : (
                <ul className="divide-y">
                  {pending.map((person) => <li className="py-2" key={person.userId}>{person.fullName}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
