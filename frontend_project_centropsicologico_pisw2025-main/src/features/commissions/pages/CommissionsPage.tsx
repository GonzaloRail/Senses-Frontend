import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  CalendarDays,
  FileDown,
  FileSpreadsheet,
  Eye,
  Pencil,
  RefreshCw,
  Search,
  Stethoscope,
  WalletCards,
} from "lucide-react";

import { SiteHeader } from "@/shared/components/SiteHeader";
import { Loading } from "@/shared/components/Loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/store/auth/auth.store";
import type {
  CommissionReportData,
} from "@/shared/interfaces/models/Financial";
import { getCommissionReportApi } from "../api/commissionsApi";
import { exportCommissionsExcel } from "@/features/reports/utils/exportExcel";
import { exportToPdf } from "@/features/reports/utils/exportPdf";
import { CommissionDetailsDialog } from "../components/CommissionDetailsDialog";
import { getLimaMonthRange } from "@/shared/utils/limaDates";
import { commissionMoney as money, summarizeCommissionRows } from "../utils/commissionReport";

const initialRange = getLimaMonthRange();

export const CommissionsPage = () => {
  const navigate = useNavigate();
  const canEdit = useAuth((state) => state.roleSelected) === "ADMIN";
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [search, setSearch] = useState("");
  const [details, setDetails] = useState<{
    psychologistId: string;
    psychologistName: string;
    dateFrom: string;
    dateTo: string;
  } | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["commission-report", dateFrom, dateTo],
    queryFn: () => getCommissionReportApi({ dateFrom, dateTo }),
    enabled: Boolean(dateFrom && dateTo && dateFrom <= dateTo),
    refetchOnWindowFocus: "always",
  });

  const visibleReport = useMemo<CommissionReportData | undefined>(() => {
    if (!data) return undefined;
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return data;

    const rows = data.rows.filter((item) =>
      item.psychologist.toLocaleLowerCase("es").includes(query)
    );
    const warnings = data.warnings.filter((warning) =>
      `${warning.firstName} ${warning.lastName}`
        .toLocaleLowerCase("es")
        .includes(query)
    );

    return {
      rows,
      warnings,
      summary: summarizeCommissionRows(rows),
    };
  }, [data, search]);

  const exportReport = visibleReport ?? data;
  const summary = isError ? undefined : data?.summary;

  const handleExcel = () => {
    if (!exportReport) return;
    exportCommissionsExcel(
      exportReport,
      `reporte-comisiones-${dateFrom}-${dateTo}`,
      dateFrom,
      dateTo
    );
  };

  const handlePdf = () => {
    if (!exportReport) return;
    exportToPdf("commissions", exportReport, dateFrom, dateTo);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader title="Configuración y cálculo de comisiones" />

      <main className="mx-auto w-full max-w-[1500px] space-y-5 p-4 md:p-6">
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Ingreso bruto del periodo"
            value={summary ? money(summary.grossIncome) : "—"}
            icon={<WalletCards className="h-5 w-5" />}
          />
          <SummaryCard
            label="Comisiones a pagar"
            value={summary ? money(summary.commissionAmount) : "—"}
            icon={<Stethoscope className="h-5 w-5" />}
            valueClassName="text-emerald-600"
          />
          <SummaryCard
            label="Margen neto de la clínica"
            value={summary ? money(summary.clinicNetAmount) : "—"}
            icon={<FileDown className="h-5 w-5" />}
            valueClassName="text-blue-600"
          />
        </section>

        {!isError && (data?.warnings.length ?? 0) > 0 && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            El ingreso bruto incluye todos los cobros efectivos. Comisión y margen definitivos están pendientes porque faltan tasas.
            Comisión calculada: {money(data!.summary.knownCommissionAmount)}; margen calculado: {money(data!.summary.knownClinicNetAmount)};
            bruto pendiente de tasa: {money(data!.summary.unresolvedGrossIncome)}.
          </p>
        )}

        <Card className="overflow-hidden shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Comisiones por psicólogo</h2>
              <p className="text-sm text-muted-foreground">
                La comisión se calcula sobre cobros efectivos, con la tasa vigente en la fecha y hora de cada cobro.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Desde</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full sm:w-[155px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                <Input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full sm:w-[155px]"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar psicólogo"
                  className="w-full pl-9 sm:w-[210px]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching || !dateFrom || !dateTo || dateFrom > dateTo}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                {isFetching ? "Actualizando..." : "Actualizar"}
              </Button>
              <Button
                type="button"
                onClick={handleExcel}
                disabled={!exportReport || isFetching || isError || dateFrom > dateTo}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                type="button"
                onClick={handlePdf}
                disabled={!exportReport || isFetching || isError || dateFrom > dateTo}
                variant="destructive"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {dateFrom > dateTo ? (
            <div className="p-8 text-center text-sm text-red-600">
              La fecha inicial no puede ser posterior a la fecha final.
            </div>
          ) : isLoading ? (
            <Loading message="Calculando comisiones del periodo..." />
          ) : isError ? (
            <div className="p-8 text-center text-sm text-red-600">
              No se pudo obtener el reporte de comisiones.
            </div>
          ) : (
            <>
              {(visibleReport?.warnings.length ?? 0) > 0 && (
                <div className="m-4 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Hay psicólogos sin una tasa válida.</p>
                    <p>
                      Revisa las vigencias de sus cobros. Configurar una tasa desde hoy no resuelve necesariamente los cobros anteriores.
                    </p>
                    <div className="mt-2 space-y-2">
                      {visibleReport?.warnings.map((warning) => (
                        <div key={warning.allocationId ?? warning.psychologistId} className="flex flex-wrap items-center gap-3">
                          <span>{`${warning.firstName} ${warning.lastName}`.trim()}</span>
                          {warning.receiptLabel && <span>{warning.receiptLabel}</span>}
                          {warning.paidAt && <span>Cobro: {new Date(warning.paidAt).toLocaleString("es-PE", { timeZone: "America/Lima" })}</span>}
                          <Button size="sm" variant="outline" onClick={() => setDetails({
                            psychologistId: warning.psychologistId,
                            psychologistName: `${warning.firstName} ${warning.lastName}`.trim(),
                            dateFrom, dateTo,
                          })}>Ver detalles</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Psicólogo</TableHead>
                      <TableHead className="text-center">Citas cobradas</TableHead>
                      <TableHead className="text-right">Ingreso bruto</TableHead>
                      <TableHead className="text-center">Detalle por cita</TableHead>
                      <TableHead className="text-right">A pagar</TableHead>
                      <TableHead className="text-right">Margen neto</TableHead>
                      {canEdit && <TableHead className="text-center">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(visibleReport?.rows.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canEdit ? 7 : 6}
                          className="h-40 text-center text-muted-foreground"
                        >
                          {(visibleReport?.warnings.length ?? 0) > 0
                            ? "Hay cobros pendientes de tasa. No hay filas con cálculo completo para estos filtros."
                            : "No hay citas cobradas para los filtros seleccionados."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleReport?.rows.map((item) => (
                        <TableRow key={item.psychologistId}>
                          <TableCell className="font-medium">{item.psychologist}</TableCell>
                          <TableCell className="text-center">{item.receiptsCount}</TableCell>
                          <TableCell className="text-right">{money(item.grossIncome)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetails({
                                psychologistId: item.psychologistId,
                                psychologistName: item.psychologist,
                                dateFrom,
                                dateTo,
                              })}
                              aria-label={`Ver detalles de comisiones de ${item.psychologist}`}
                            >
                              <Eye className="h-4 w-4" />
                              Ver detalles
                            </Button>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-700">
                            {money(item.commission)}
                            {item.commission === null && <p className="text-xs font-normal text-muted-foreground">Calculado: {money(item.knownCommissionAmount)}</p>}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {money(item.clinicNet)}
                            {item.clinicNet === null && <p className="text-xs font-normal text-muted-foreground">Calculado: {money(item.knownClinicNetAmount)} · Bruto sin tasa: {money(item.unresolvedGrossIncome)}</p>}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => navigate(`/user-information/${item.psychologistId}`)}
                              >
                                <Pencil className="h-4 w-4" />
                                Editar tasa
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Periodo seleccionado: {dateFrom} al {dateTo}
                </span>
                <span>{data?.summary.paidAppointmentsCount ?? 0} citas cobradas en total</span>
              </div>
            </>
          )}
        </Card>
      </main>
      {details && (
        <CommissionDetailsDialog {...details} onClose={() => setDetails(null)} />
      )}
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  valueClassName?: string;
}

const SummaryCard = ({ label, value, icon, valueClassName = "" }: SummaryCardProps) => (
  <Card className="shadow-sm">
    <CardContent className="flex items-start justify-between p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${valueClassName}`}>{value}</p>
      </div>
      <div className="rounded-lg bg-muted p-2 text-muted-foreground">{icon}</div>
    </CardContent>
  </Card>
);
