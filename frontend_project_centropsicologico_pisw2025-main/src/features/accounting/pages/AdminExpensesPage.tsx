import { useState, useMemo } from "react";
import { format, addDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDateTime } from "@/shared/utils/formatters";
import { Search, FileSpreadsheet, CheckCircle2, XCircle, Clock, Wallet, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountingExpensesApi } from "../api/accountingExpensesApi";

export const AdminExpensesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const queryClient = useQueryClient();

  // Diccionarios
  const receiptTypeMap: Record<string, string> = {
    "INVOICE": "Factura",
    "ELECTRONIC_RECEIPT": "Recibo Electrónico",
    "TICKET": "Boleta/Ticket",
    "SCREENSHOT": "Captura de Pantalla",
    "NO_RECEIPT": "Sin Comprobante"
  };

  const purposeMap: Record<string, string> = {
    "SERVICES": "Servicios Básicos",
    "MATERIALS": "Materiales",
    "TAXES": "Impuestos",
    "OTHER": "Otros"
  };

  // React Query: Obtener Egresos
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["accountingExpensesAdmin", dateRange],
    queryFn: () => accountingExpensesApi.getAll({
      startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
      endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      take: 1000 // Para traer todos en este demo
    }),
  });

  const expenses = responseData?.data || [];

  // React Query: Aprobar / Rechazar
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: "APPROVED" | "REJECTED" }) => 
      accountingExpensesApi.updateStatus(id, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Gasto ${variables.status === 'APPROVED' ? 'aprobado' : 'rechazado'}`, { 
        description: "El libro de egresos ha sido actualizado." 
      });
      queryClient.invalidateQueries({ queryKey: ["accountingExpensesAdmin"] });
    },
    onError: () => {
      toast.error("Error al actualizar", { description: "Hubo un problema al conectarse con el servidor." });
    }
  });

  const handleApprove = (id: string) => {
    statusMutation.mutate({ id, status: "APPROVED" });
  };

  const handleReject = (id: string) => {
    statusMutation.mutate({ id, status: "REJECTED" });
  };

  const handleExportExcel = () => {
    if (filteredExpenses.length === 0) {
      toast.error("Sin datos", { description: "No hay egresos para exportar con estos filtros." });
      return;
    }

    // Cabeceras del CSV
    const headers = ["Fecha", "Comprobante", "Nro Comprobante", "Proveedor", "RUC/DNI", "Concepto", "Area", "Monto (S/)", "Estado"];
    
    // Mapeo de filas
    const rows = filteredExpenses.map(exp => [
      formatDateTime(exp.createdAt).replace(",", ""),
      receiptTypeMap[exp.receiptType] || exp.receiptType,
      exp.receiptNumber || "-",
      exp.supplierName ? `"${exp.supplierName.replace(/"/g, '""')}"` : "-",
      exp.supplierDocument || "-",
      `"${exp.concept.replace(/"/g, '""')}"`, 
      purposeMap[exp.purpose] || exp.purpose,
      Number(exp.amount).toFixed(2),
      exp.status === "APPROVED" ? "Aprobado" : exp.status === "REJECTED" ? "Rechazado" : "Pendiente"
    ]);

    // Construcción del contenido
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Descarga del archivo con BOM para UTF-8 en Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Egresos_Senses_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("¡Exportación exitosa!", { description: "El archivo Excel (CSV) se ha descargado." });
  };

  // Cálculo de estadísticas
  const stats = useMemo(() => {
    return {
      totalGastado: expenses.filter(e => e.status === "APPROVED").reduce((acc, curr) => acc + curr.amount, 0),
      pendientes: expenses.filter(e => e.status === "PENDING").length,
      rechazados: expenses.filter(e => e.status === "REJECTED").length
    };
  }, [expenses]);

  // Filtros
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.concept.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (exp.supplierDocument && exp.supplierDocument.includes(searchTerm)) ||
                          (exp.supplierName && exp.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || exp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none font-bold uppercase text-[10px]">Aprobado</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none shadow-none font-bold uppercase text-[10px]">Rechazado</Badge>;
      case "PENDING":
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shadow-none font-bold uppercase text-[10px]">Pendiente</Badge>;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50/50">
      <SiteHeader title="Libro de Egresos (Administración)" />
      
      <div className="flex-1 p-6 overflow-y-auto custom-scroll">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-gradient-to-br from-senses-primary to-senses-primary/80 text-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-senses-primary-foreground/80 font-medium text-sm">Total Gastado (Aprobados)</p>
                  <h3 className="text-3xl font-bold mt-1">S/ {Number(stats.totalGastado).toFixed(2)}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 font-medium text-sm">Por Revisar (Pendientes)</p>
                  <h3 className="text-3xl font-bold mt-1 text-amber-600">{stats.pendientes}</h3>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 font-medium text-sm">Gastos Rechazados</p>
                  <h3 className="text-3xl font-bold mt-1 text-red-600">{stats.rechazados}</h3>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Buscar por RUC o concepto..." 
                  className="pl-9 h-10 text-sm rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="APPROVED">Aprobados</SelectItem>
                    <SelectItem value="REJECTED">Rechazados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[260px] justify-start text-left font-normal h-10 rounded-lg",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd LLL, y", { locale: es })} -{" "}
                            {format(dateRange.to, "dd LLL, y", { locale: es })}
                          </>
                        ) : (
                          format(dateRange.from, "dd LLL, y", { locale: es })
                        )
                      ) : (
                        <span>Filtrar por fechas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 flex flex-col md:flex-row" align="end">
                    <div className="flex flex-col gap-1 p-3 border-r border-slate-100 bg-slate-50/50">
                      <Button variant="ghost" size="sm" className="justify-start text-xs font-medium text-slate-600 hover:text-slate-900" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>
                        Este mes
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start text-xs font-medium text-slate-600 hover:text-slate-900" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })}>
                        Mes pasado
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start text-xs font-medium text-slate-600 hover:text-slate-900" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 3)), to: endOfMonth(new Date()) })}>
                        Últimos 3 meses
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start text-xs font-medium text-slate-600 hover:text-slate-900" onClick={() => setDateRange({ from: startOfYear(new Date()), to: endOfYear(new Date()) })}>
                        Este año
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start text-xs font-medium text-slate-600 hover:text-slate-900" onClick={() => setDateRange({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) })}>
                        Año pasado
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 mt-2" onClick={() => setDateRange(undefined)}>
                        Limpiar fechas
                      </Button>
                    </div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={es}
                      captionLayout="dropdown"
                      startMonth={new Date(2020, 0)}
                      endMonth={new Date(2030, 11)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <Button 
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10 px-4 shadow-sm w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar a Excel
            </Button>
          </div>

          {/* Table Area */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600">Fecha</TableHead>
                    <TableHead className="font-semibold text-slate-600">Comprobante</TableHead>
                    <TableHead className="font-semibold text-slate-600">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-600 w-1/4">Concepto</TableHead>
                    <TableHead className="font-semibold text-slate-600">Área</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right">Monto (S/)</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                        Cargando egresos desde el servidor...
                      </TableCell>
                    </TableRow>
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                        No se encontraron gastos que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(expense.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-700">
                          {receiptTypeMap[expense.receiptType] || expense.receiptType} <br/>
                          <span className="text-xs text-slate-400 font-normal">{expense.receiptNumber}</span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-800">
                          {expense.supplierName || "-"}<br/>
                          <span className="text-xs text-slate-400 font-normal">{expense.supplierDocument}</span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-800">
                          {expense.concept}
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            {purposeMap[expense.purpose] || expense.purpose}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-800">
                          S/ {Number(expense.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(expense.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          {expense.status === "PENDING" ? (
                            <div className="flex justify-center items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 rounded-full disabled:opacity-50"
                                onClick={() => handleApprove(expense.id)}
                                disabled={statusMutation.isPending}
                                title="Aprobar"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 rounded-full disabled:opacity-50"
                                onClick={() => handleReject(expense.id)}
                                disabled={statusMutation.isPending}
                                title="Rechazar"
                              >
                                <XCircle className="w-5 h-5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Auditado</span>
                          )}
                        </TableCell>
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
