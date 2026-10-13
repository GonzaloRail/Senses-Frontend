import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCommissionDetailsApi } from "../api/commissionsApi";

interface Props {
  psychologistId: string;
  psychologistName: string;
  dateFrom: string;
  dateTo: string;
  onClose: () => void;
}

function money(value: string | null) {
  if (value === null) return "Pendiente de tasa";
  return `S/ ${Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima", dateStyle: "short", timeStyle: "short",
  }).format(new Date(value));
}

function dateLabel(value: string) {
  return value.split("-").reverse().join("/");
}

export function CommissionDetailsDialog({ psychologistId, psychologistName, dateFrom, dateTo, onClose }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["commission-details", psychologistId, dateFrom, dateTo, page],
    queryFn: ({ signal }) => getCommissionDetailsApi({ psychologistId, dateFrom, dateTo, page }, signal),
    retry: false,
    refetchOnWindowFocus: "always",
  });

  const endpointUnavailable = isAxiosError(error) && error.response?.status === 404;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-5xl">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle>Detalle de comisiones — {psychologistName}</DialogTitle>
          <DialogDescription>
            Cobros del {dateLabel(dateFrom)} al {dateLabel(dateTo)}. Fechas en hora de Lima.
            El porcentaje se aplica según la fecha del cobro, no la fecha de la cita.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto">
          {isLoading ? (
            <p className="py-12 text-center text-muted-foreground" role="status">Cargando citas y cobros...</p>
          ) : isError ? (
            <div className="space-y-3 rounded-lg border border-destructive/30 p-6 text-center" role="alert">
              <p className="text-sm text-destructive">
                {endpointUnavailable
                  ? "No se encontró el detalle solicitado. Verifica que el backend tenga desplegada la consulta de detalles."
                  : "No se pudo cargar el detalle de comisiones. Intenta nuevamente."}
              </p>
              <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className="h-4 w-4" /> Reintentar
              </Button>
            </div>
          ) : data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Total label="Ingreso efectivo del periodo" value={money(data.summary.grossIncome)} />
                <Total label="Comisión del psicólogo" value={money(data.summary.commissionAmount)} />
                <Total label="Margen de la clínica" value={money(data.summary.clinicNetAmount)} />
              </div>

              {data.summary.calculationStatus === "MISSING_COMMISSION_RATE" && (
                <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p>Hay cobros sin una tasa vigente. Sus comisiones se muestran pendientes y el total no puede calcularse hasta configurar la tasa correspondiente.</p>
                </div>
              )}

              {data.data.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No hay citas con cobros efectivos en este periodo.</p>
              ) : data.data.map((appointment) => (
                <section key={appointment.appointmentId} className="overflow-hidden rounded-lg border">
                  <div className="space-y-2 border-b bg-muted/30 p-4">
                    <h3 className="font-semibold">Cita del {dateTime(appointment.appointmentDate)}</h3>
                    <p className="text-xs text-muted-foreground break-all">ID: {appointment.appointmentId}</p>
                    {appointment.serviceName && <p className="text-sm text-muted-foreground">{appointment.serviceName}</p>}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      <span>Cobrado: {money(appointment.collectedAmount)}</span>
                      <span>Devuelto: {money(appointment.refundedAmount)}</span>
                      <span>Ingreso efectivo: {money(appointment.grossIncome)}</span>
                      <span className="font-semibold">Comisión de la cita: {money(appointment.commissionAmount)}</span>
                      <span>Margen: {money(appointment.clinicNetAmount)}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha del cobro</TableHead>
                          <TableHead>Comprobante</TableHead>
                          <TableHead className="text-right">Cobrado</TableHead>
                          <TableHead className="text-right">Devuelto</TableHead>
                          <TableHead className="text-right">Efectivo</TableHead>
                          <TableHead className="text-right">Porcentaje</TableHead>
                          <TableHead className="text-right">Comisión</TableHead>
                          <TableHead className="text-right">Margen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointment.payments.map((payment) => (
                          <TableRow key={payment.allocationId}>
                            <TableCell className="whitespace-nowrap">{dateTime(payment.paidAt)}</TableCell>
                            <TableCell className="whitespace-nowrap">{payment.receiptLabel}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">{money(payment.collectedAmount)}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">{money(payment.refundedAmount)}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">{money(payment.grossIncome)}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {payment.percentage === null ? "Sin tasa" : `${Number(payment.percentage)}%`}
                            </TableCell>
                            <TableCell className="text-right font-semibold whitespace-nowrap">{money(payment.commissionAmount)}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">{money(payment.clinicNetAmount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              ))}

              <p className="text-xs text-muted-foreground">Los importes por cita incluyen únicamente sus cobros efectivos del periodo seleccionado, descontando las devoluciones registradas.</p>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <p className="text-sm text-muted-foreground">{data.summary.paidAppointmentsCount} citas en el periodo · Página {page} de {Math.max(data.meta.totalPages, 1)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => current - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages || isFetching} onClick={() => setPage((current) => current + 1)}>
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}
