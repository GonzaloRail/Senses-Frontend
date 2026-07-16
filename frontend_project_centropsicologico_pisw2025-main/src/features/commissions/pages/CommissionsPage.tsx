import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Download, DollarSign, Calculator, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { mockPsychologists, mockReceipts, type MockPsychologist } from "../data/mockCommissions";
import { Badge } from "@/components/ui/badge";

export const CommissionsPage = () => {
  const [selectedPsyId, setSelectedPsyId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const selectedPsy: MockPsychologist | undefined = mockPsychologists.find((p) => p.id === selectedPsyId);

  // Filtrado y cálculo
  const processedReceipts = useMemo(() => {
    return mockReceipts.filter((receipt) => {
      // 1. Filtrar por psicólogo
      if (selectedPsyId !== "all" && receipt.psychologistId !== selectedPsyId) return false;
      
      // 2. Filtrar por fecha
      if (dateRange?.from && dateRange?.to) {
        const receiptDate = new Date(receipt.date);
        return isWithinInterval(receiptDate, { start: dateRange.from, end: dateRange.to });
      }
      return true;
    }).map(receipt => {
      const psy = mockPsychologists.find(p => p.id === receipt.psychologistId);
      const percentage = psy?.commissionPercentage || 0;
      // Los anulados no suman comisión
      const commissionAmount = receipt.status === "PAID" ? (receipt.amount * percentage) / 100 : 0;
      return { ...receipt, psyName: psy?.name, percentage, commissionAmount };
    });
  }, [selectedPsyId, dateRange]);

  const totalGenerated = processedReceipts.reduce((acc, curr) => curr.status === "PAID" ? acc + curr.amount : acc, 0);
  const totalCommission = processedReceipts.reduce((acc, curr) => acc + curr.commissionAmount, 0);
  const validReceiptsCount = processedReceipts.filter(r => r.status === "PAID").length;

  const handleExport = () => {
    alert("Funcionalidad de exportación simulada (PDF/Excel) - En desarrollo Backend");
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50/50">
      <SiteHeader title="Cálculo de Comisiones (Prototipo)" />
      
      <div className="flex-1 p-6 overflow-y-auto custom-scroll">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Controles Superiores */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Select value={selectedPsyId} onValueChange={setSelectedPsyId}>
                <SelectTrigger className="w-[250px] bg-white h-10">
                  <SelectValue placeholder="Seleccionar Psicólogo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los psicólogos</SelectItem>
                  {mockPsychologists.map((psy) => (
                    <SelectItem key={psy.id} value={psy.id}>
                      {psy.name} ({psy.commissionPercentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal bg-white h-10",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                          {format(dateRange.to, "LLL dd, y", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y", { locale: es })
                      )
                    ) : (
                      <span>Selecciona un rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 h-10">
              <Download className="mr-2 h-4 w-4" /> Exportar Reporte
            </Button>
          </div>

          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Recibos Válidos</CardTitle>
                <FileText className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{validReceiptsCount}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Ingreso Generado Bruto</CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">S/ {totalGenerated.toFixed(2)}</div>
                <p className="text-xs text-slate-400 mt-1">Total sin descuentos</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-emerald-200 bg-emerald-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-800">Total a Pagar (Comisión)</CardTitle>
                <Calculator className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-700">S/ {totalCommission.toFixed(2)}</div>
                {selectedPsy && <p className="text-xs text-emerald-600 mt-1">Regla: {selectedPsy.commissionPercentage}% aplicado</p>}
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Detalle */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b bg-slate-50/50">
              <h2 className="font-semibold text-slate-800">Detalle de Recibos Procesados</h2>
            </div>
            <div className="flex-1 overflow-auto custom-scroll">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Recibo</TableHead>
                    {selectedPsyId === "all" && <TableHead>Psicólogo</TableHead>}
                    <TableHead>Paciente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto Base</TableHead>
                    <TableHead className="text-right">Comisión (%)</TableHead>
                    <TableHead className="text-right font-semibold">A Pagar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedReceipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedPsyId === "all" ? 9 : 8} className="text-center h-32 text-slate-500">
                        No se encontraron recibos en este periodo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedReceipts.map((receipt) => (
                      <TableRow key={receipt.id} className={receipt.status === "ANNULLED" ? "opacity-50" : ""}>
                        <TableCell className="whitespace-nowrap">{format(new Date(receipt.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-medium text-slate-700">{receipt.id}</TableCell>
                        {selectedPsyId === "all" && <TableCell>{receipt.psyName}</TableCell>}
                        <TableCell>{receipt.patientName}</TableCell>
                        <TableCell>{receipt.service}</TableCell>
                        <TableCell>
                          <Badge variant={receipt.status === "PAID" ? "default" : "destructive"} className={receipt.status === "PAID" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                            {receipt.status === "PAID" ? "Pagado" : "Anulado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">S/ {receipt.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{receipt.percentage}%</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">S/ {receipt.commissionAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
