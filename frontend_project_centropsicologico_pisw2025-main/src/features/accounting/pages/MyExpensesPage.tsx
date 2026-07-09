import { useState, useEffect } from "react";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDateTime } from "@/shared/utils/formatters";
import { Plus, Receipt, Search } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountingExpensesApi } from "../api/accountingExpensesApi";

// Form Schema
const expenseSchema = z.object({
  type: z.enum(["FIXED", "VARIABLE", "ASSET"]),
  concept: z.string().min(3, "El concepto debe tener al menos 3 caracteres"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  purpose: z.enum(["SERVICES", "MATERIALS", "TAXES", "OTHER"]),
  supplierName: z.string().min(2, "El nombre del proveedor es obligatorio"),
  supplierDocument: z.string().min(8, "El RUC/DNI debe tener al menos 8 dígitos"),
  receiptType: z.enum(["INVOICE", "ELECTRONIC_RECEIPT", "TICKET", "SCREENSHOT", "NO_RECEIPT"]),
  receiptNumber: z.string().min(1, "El número de comprobante es obligatorio"),
  paymentMethod: z.enum(["YAPE", "PLIN", "CASH", "BANK_TRANSFER", "CARD"]),
  observations: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const MyExpensesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Mapeos de UI a Backend y viceversa
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
    queryKey: ["accountingExpenses"],
    queryFn: () => accountingExpensesApi.getAll(),
  });

  const expenses = responseData?.data || [];

  // React Query: Crear Egreso
  const createMutation = useMutation({
    mutationFn: accountingExpensesApi.create,
    onSuccess: () => {
      toast.success("Egreso registrado correctamente", {
        description: "Ha sido enviado a Gerencia para su aprobación.",
      });
      queryClient.invalidateQueries({ queryKey: ["accountingExpenses"] });
      setIsModalOpen(false);
      reset();
    },
    onError: () => {
      toast.error("Error al registrar egreso", {
        description: "Hubo un problema al conectarse con el servidor.",
      });
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: "FIXED",
      purpose: "SERVICES",
      receiptType: "INVOICE",
      paymentMethod: "CASH",
      amount: 0,
      concept: "",
      supplierName: "",
      supplierDocument: "",
      receiptNumber: "",
      observations: "",
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    createMutation.mutate(data);
  };

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

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredExpenses = expenses.filter(exp => 
    exp.concept.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (exp.supplierDocument && exp.supplierDocument.includes(searchTerm)) ||
    (exp.supplierName && exp.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE));
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="h-screen flex flex-col bg-slate-50/50">
      <SiteHeader title="Mis Gastos (Psicología / Admisión)" />
      
      <div className="flex-1 p-6 overflow-y-auto custom-scroll">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Buscar RUC, concepto, proveedor, N° comprobante..." 
                className="pl-9 h-10 text-sm rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-senses-primary hover:bg-senses-primary/90 text-white rounded-lg h-10 px-4 shadow-sm w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] bg-slate-50">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Receipt className="w-5 h-5 text-senses-primary" />
                    Registro de Egresos
                  </DialogTitle>
                  <DialogDescription>
                    Complete los datos del comprobante y la clasificación interna del gasto.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Datos del Comprobante */}
                    <div className="space-y-4 bg-white p-4 rounded-xl border shadow-sm">
                      <h4 className="font-semibold text-slate-700 text-sm border-b pb-2">1. Datos del Comprobante</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600">Tipo Comprobante *</label>
                          <Controller
                            control={control}
                            name="receiptType"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className={errors.receiptType ? "border-red-500" : ""}>
                                  <SelectValue placeholder="Seleccione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INVOICE">Factura</SelectItem>
                                  <SelectItem value="ELECTRONIC_RECEIPT">Recibo Electrónico</SelectItem>
                                  <SelectItem value="TICKET">Boleta/Ticket</SelectItem>
                                  <SelectItem value="SCREENSHOT">Captura</SelectItem>
                                  <SelectItem value="NO_RECEIPT">Sin Comprobante</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600">Nro Comprobante *</label>
                          <Input placeholder="EJ: F001-2345" {...register("receiptNumber")} className={errors.receiptNumber ? "border-red-500" : ""} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">RUC/DNI del Proveedor *</label>
                        <Input placeholder="Ingrese el número" {...register("supplierDocument")} className={errors.supplierDocument ? "border-red-500" : ""} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Razón Social o Nombre *</label>
                        <Input placeholder="Nombre del proveedor" {...register("supplierName")} className={errors.supplierName ? "border-red-500" : ""} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600">Forma de Pago *</label>
                          <Controller
                            control={control}
                            name="paymentMethod"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CASH">Efectivo</SelectItem>
                                  <SelectItem value="BANK_TRANSFER">Transferencia</SelectItem>
                                  <SelectItem value="YAPE">Yape</SelectItem>
                                  <SelectItem value="PLIN">Plin</SelectItem>
                                  <SelectItem value="CARD">Tarjeta</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-600">Monto (S/) *</label>
                          <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} className={errors.amount ? "border-red-500" : ""} />
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: Clasificación */}
                    <div className="space-y-4 bg-white p-4 rounded-xl border shadow-sm">
                      <h4 className="font-semibold text-slate-700 text-sm border-b pb-2">2. Finalidad y Clasificación</h4>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Área / Finalidad *</label>
                        <Controller
                          control={control}
                          name="purpose"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione el área" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SERVICES">Servicios Básicos</SelectItem>
                                <SelectItem value="MATERIALS">Materiales</SelectItem>
                                <SelectItem value="TAXES">Impuestos</SelectItem>
                                <SelectItem value="OTHER">Otros</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Tipo de Egreso *</label>
                        <Controller
                          control={control}
                          name="type"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione el tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIXED">Fijo</SelectItem>
                                <SelectItem value="VARIABLE">Variable</SelectItem>
                                <SelectItem value="ASSET">Activo Fijo</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Concepto *</label>
                        <Input placeholder="Ej: Pago mensualidad internet" {...register("concept")} className={errors.concept ? "border-red-500" : ""} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Observaciones</label>
                        <Textarea 
                          placeholder="Detalles adicionales del gasto..." 
                          className="h-20 resize-none text-sm"
                          {...register("observations")}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} className="bg-senses-primary text-white">
                      {createMutation.isPending ? "Guardando..." : "Guardar Egreso"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600">Fecha</TableHead>
                    <TableHead className="font-semibold text-slate-600">Comprobante</TableHead>
                    <TableHead className="font-semibold text-slate-600">RUC/DNI</TableHead>
                    <TableHead className="font-semibold text-slate-600">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-600 w-1/4">Concepto</TableHead>
                    <TableHead className="font-semibold text-slate-600">Área</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right">Monto (S/)</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                        Cargando egresos...
                      </TableCell>
                    </TableRow>
                  ) : paginatedExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                        No se encontraron gastos que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedExpenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(expense.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-700">
                          {receiptTypeMap[expense.receiptType] || expense.receiptType} <br/>
                          <span className="text-xs text-slate-400 font-normal">{expense.receiptNumber}</span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {expense.supplierDocument || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-800">
                          {expense.supplierName || "-"}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Controles de paginación */}
            {filteredExpenses.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-slate-50/50 gap-4">
                <div className="text-sm text-slate-500">
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)} de {filteredExpenses.length} resultados
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="text-sm text-slate-600 font-medium px-2">
                    Página {currentPage} de {totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
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
