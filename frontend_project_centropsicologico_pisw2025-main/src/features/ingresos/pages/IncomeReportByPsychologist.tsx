import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Loading } from "@/shared/components/Loading";
import { ingresosApi } from "../api/ingresosApi";

interface PsychologistRow {
  psychologist: string;
  patientsCount: number;
  totalIncome: number;
  receiptsCount: number;
}

function money(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fetchReport(dateFrom: string, dateTo: string): Promise<PsychologistRow[]> {
  return ingresosApi.getFiltered({
    dateFrom, dateTo,
    patient: "", client: "", psychologist: "",
    payment: "", number: "",
  }).then((list) => {
    const grouped = new Map<string, { total: number; patients: Set<string>; count: number }>();

    for (const item of list) {
      if (item.status === "Anulado") continue;
      const name = item.psychologist || "Sin asignar";
      const entry = grouped.get(name) || { total: 0, patients: new Set<string>(), count: 0 };
      entry.total += item.total;
      if (item.patient) entry.patients.add(item.patient);
      entry.count += 1;
      grouped.set(name, entry);
    }

    return Array.from(grouped.entries())
      .map(([psychologist, data]) => ({
        psychologist,
        patientsCount: data.patients.size,
        totalIncome: Math.round(data.total * 100) / 100,
        receiptsCount: data.count,
      }))
      .sort((a, b) => b.totalIncome - a.totalIncome);
  });
}

export const IncomeReportByPsychologist = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["incomeReportByPsychologist", dateFrom, dateTo],
    queryFn: () => fetchReport(dateFrom, dateTo),
    enabled: false,
  });

  const handleGenerate = () => {
    if (dateFrom && dateTo) refetch();
  };

  return (
    <>
      <SiteHeader title="Reporte de ingresos por psicólogo" backButton />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <Card>
              <CardHeader>
                <CardTitle>Filtros del reporte</CardTitle>
                <CardDescription>
                  Seleccione el rango de fechas para generar el reporte de ingresos por psicólogo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="space-y-1">
                    <Label>Desde</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Hasta</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <Button onClick={handleGenerate} disabled={!dateFrom || !dateTo}>
                    Generar reporte
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  {data && data.length > 0
                    ? `${data.length} psicólogo(s) con ingresos en el período`
                    : data
                      ? "Sin ingresos en el período seleccionado"
                      : "Configure los filtros y presione 'Generar reporte'"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loading message="Generando reporte..." />
                ) : isError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
                    <p className="font-bold">Error al generar el reporte</p>
                    <p className="text-sm mt-1">{(error as Error)?.message || "No se pudo conectar con el servidor"}</p>
                  </div>
                ) : data && data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-3 font-bold text-muted-foreground text-left">Psicólogo</th>
                          <th className="p-3 font-bold text-muted-foreground text-center">Pacientes</th>
                          <th className="p-3 font-bold text-muted-foreground text-center">Recibos</th>
                          <th className="p-3 font-bold text-muted-foreground text-right">Total ingresos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, i) => (
                          <tr key={i} className="border-t hover:bg-muted/30">
                            <td className="p-3 font-medium">{row.psychologist}</td>
                            <td className="p-3 text-center">{row.patientsCount}</td>
                            <td className="p-3 text-center">{row.receiptsCount}</td>
                            <td className="p-3 text-right font-bold text-green-600">{money(row.totalIncome)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 bg-muted/30">
                          <td className="p-3 font-bold">Total</td>
                          <td className="p-3 text-center font-bold">
                            {[...new Set(data.flatMap(() => []))].length || data.length}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {data.reduce((s, r) => s + r.receiptsCount, 0)}
                          </td>
                          <td className="p-3 text-right font-bold text-green-600">
                            {money(data.reduce((s, r) => s + r.totalIncome, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : data && data.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No se encontraron ingresos en el período seleccionado.</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Seleccione un rango de fechas y presione "Generar reporte"
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
