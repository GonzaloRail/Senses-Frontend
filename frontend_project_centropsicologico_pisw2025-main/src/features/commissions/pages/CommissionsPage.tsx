import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, DollarSign, FileText, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommissionsApi, payCommissionApi } from "../api/commissionsApi";
import { toast } from "sonner";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const CommissionsPage = () => {
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const take = 10;

  // Query para obtener comisiones
  const { data, isLoading, isError } = useQuery({
    queryKey: ["commissions", { page, take, status: statusFilter !== "all" ? statusFilter : undefined }],
    queryFn: () => getCommissionsApi({ 
      page, 
      take, 
      status: statusFilter !== "all" ? statusFilter : undefined 
    }),
  });

  // Mutación para pagar comisión
  const payMutation = useMutation({
    mutationFn: payCommissionApi,
    onSuccess: () => {
      toast.success("Comisión pagada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
    onError: () => {
      toast.error("Error al pagar la comisión");
    }
  });

  const commissions = data?.data || [];
  const meta = data?.meta;

  const handleExport = () => {
    alert("Funcionalidad de exportación simulada (PDF/Excel) - En desarrollo Backend");
  };

  const handlePay = (id: string) => {
    if (confirm("¿Estás seguro de marcar esta comisión como PAGADA?")) {
      payMutation.mutate(id);
    }
  };

  const totalGenerated = commissions.reduce((acc, curr) => acc + Number(curr.grossIncome), 0);
  const totalCommission = commissions.reduce((acc, curr) => acc + Number(curr.commissionAmount), 0);
  const totalSenses = commissions.reduce((acc, curr) => acc + Number(curr.sensesAmount), 0);

  return (
    <div className="h-screen flex flex-col bg-slate-50/50">
      <SiteHeader title="Gestión de Comisiones" />
      
      <div className="flex-1 p-6 overflow-y-auto custom-scroll">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Controles Superiores */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex gap-4 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px] bg-white h-10">
                  <SelectValue placeholder="Estado de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="READY_FOR_PAYMENT">Listos para pago</SelectItem>
                  <SelectItem value="PAID">Pagados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 h-10">
              <Download className="mr-2 h-4 w-4" /> Exportar Reporte
            </Button>
          </div>

          {/* Tarjetas de Resumen de la página actual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Ingreso Bruto (Pág {page})</CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">S/ {totalGenerated.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Comisión Psicólogos (Pág {page})</CardTitle>
                <FileText className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">S/ {totalCommission.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Neto Senses (Pág {page})</CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">S/ {totalSenses.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Comisiones */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-auto custom-scroll">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Psicólogo</TableHead>
                    <TableHead className="text-center">% Comisión</TableHead>
                    <TableHead className="text-right">Bruto Generado</TableHead>
                    <TableHead className="text-right">Total Comisión</TableHead>
                    <TableHead className="text-right">Neto Senses</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-48 text-slate-500">
                        Cargando comisiones...
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-48 text-red-500">
                        Error al cargar las comisiones.
                      </TableCell>
                    </TableRow>
                  ) : commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-48 text-slate-500">
                        No hay comisiones generadas en la base de datos para este filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-700">
                          {c.monthlyClose ? `${MONTHS[c.monthlyClose.month - 1]} ${c.monthlyClose.year}` : "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {c.psychologist ? `${c.psychologist.firstName} ${c.psychologist.lastName}` : "Desconocido"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-slate-50">
                            {Number(c.commissionRate)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-600">
                          S/ {Number(c.grossIncome).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          S/ {Number(c.commissionAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          S/ {Number(c.sensesAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.paymentStatus === "PAID" && (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">
                              PAGADO
                            </Badge>
                          )}
                          {c.paymentStatus === "PENDING" && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                              PENDIENTE
                            </Badge>
                          )}
                          {c.paymentStatus === "READY_FOR_PAYMENT" && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                              LISTO PARA PAGO
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.paymentStatus === "PENDING" && (
                            <Button 
                              size="sm" 
                              onClick={() => handlePay(c.id)}
                              disabled={payMutation.isPending}
                              className="h-8 bg-slate-900 hover:bg-slate-800"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" /> Pagar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginación */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t bg-slate-50">
                <span className="text-sm text-slate-500">
                  Mostrando página {meta.page} de {meta.totalPages} ({meta.total} registros)
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === meta.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
