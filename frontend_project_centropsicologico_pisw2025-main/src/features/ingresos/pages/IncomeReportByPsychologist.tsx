import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { ReportTable } from "../components/ReportTable";

export const IncomeReportByPsychologist = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerated(true);
  };

  const demoData = generated
    ? [
        {
          psychologist: "---",
          patientsCount: 0,
          totalIncome: 0,
          commissionRate: 0,
          commissionAmount: 0,
        },
      ]
    : [];

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
                  {generated
                    ? "Reporte del período seleccionado"
                    : "Configure los filtros y presione 'Generar reporte'"}
              </CardDescription>
              </CardHeader>
              <CardContent>
                {generated ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">El reporte de ingresos por psicólogo estará disponible cuando el backend implemente el endpoint correspondiente.</p>
                    <p className="text-sm">Datos requeridos: psicólogo, pacientes atendidos, total ingresos, % comisión y comisión calculada.</p>
                    <ReportTable data={demoData} />
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
