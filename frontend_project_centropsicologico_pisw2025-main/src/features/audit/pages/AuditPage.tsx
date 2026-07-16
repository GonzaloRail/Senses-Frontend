import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfMonth, endOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Download, Search, RefreshCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { mockAuditLogs, uniqueUsers, type AuditRole, type AuditAction, type AuditEntity } from "../data/mockAuditLogs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const AuditPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedEntity, setSelectedEntity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      // Filtrar por fecha
      if (dateRange?.from && dateRange?.to) {
        const logDate = new Date(log.timestamp);
        if (!isWithinInterval(logDate, { start: dateRange.from, end: dateRange.to })) {
          return false;
        }
      }
      
      if (selectedUser !== "all" && log.userName !== selectedUser) return false;
      if (selectedRole !== "all" && log.userRole !== selectedRole) return false;
      if (selectedAction !== "all" && log.action !== selectedAction) return false;
      if (selectedEntity !== "all" && log.entity !== selectedEntity) return false;
      
      if (searchTerm && !log.details.toLowerCase().includes(searchTerm.toLowerCase()) && !log.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [dateRange, selectedUser, selectedRole, selectedAction, selectedEntity, searchTerm]);

  const handleExport = () => {
    alert("Exportación de auditoría simulada (CSV) - En desarrollo Backend");
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREACIÓN": return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      case "ANULACIÓN": return "bg-red-100 text-red-700 hover:bg-red-200";
      case "APROBACIÓN": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
      case "MODIFICACIÓN": return "bg-amber-100 text-amber-700 hover:bg-amber-200";
      case "EXPORTACIÓN": return "bg-purple-100 text-purple-700 hover:bg-purple-200";
      default: return "bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50/50">
      <SiteHeader title="Auditoría Contable (Prototipo)" />
      
      <div className="flex-1 p-6 overflow-y-auto custom-scroll">
        <div className="max-w-[1400px] mx-auto space-y-4">
          
          {/* Panel de Filtros */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                
                <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-[260px] justify-start text-left font-normal h-10", !dateRange && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yy", { locale: es })} - {format(dateRange.to, "dd/MM/yy", { locale: es })}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yy", { locale: es })
                          )
                        ) : (
                          <span>Rango de fechas</span>
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

                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-[150px] h-10">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Roles</SelectItem>
                      <SelectItem value="ADMIN">Gerencia</SelectItem>
                      <SelectItem value="ADMISSION">Admisión</SelectItem>
                      <SelectItem value="AUDITOR">Auditor</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-[180px] h-10">
                      <SelectValue placeholder="Usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Usuarios</SelectItem>
                      {uniqueUsers.map(user => (
                        <SelectItem key={user} value={user}>{user}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="w-[160px] h-10">
                      <SelectValue placeholder="Acción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las Acciones</SelectItem>
                      <SelectItem value="CREACIÓN">Creación</SelectItem>
                      <SelectItem value="MODIFICACIÓN">Modificación</SelectItem>
                      <SelectItem value="ANULACIÓN">Anulación</SelectItem>
                      <SelectItem value="APROBACIÓN">Aprobación</SelectItem>
                      <SelectItem value="EXPORTACIÓN">Exportación</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                    <SelectTrigger className="w-[150px] h-10">
                      <SelectValue placeholder="Entidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las Entidades</SelectItem>
                      <SelectItem value="RECIBO">Recibo</SelectItem>
                      <SelectItem value="EGRESO">Egreso</SelectItem>
                      <SelectItem value="REPORTE">Reporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleExport} variant="outline" className="h-10 text-slate-700 bg-white hover:bg-slate-100 border-slate-300">
                  <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
              </div>

              <div className="flex w-full items-center space-x-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Buscar en el detalle de la operación..."
                    className="pl-9 h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="text-sm text-slate-500 font-medium ml-4">
                  {filteredLogs.length} registro(s) encontrado(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Auditoría */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-[calc(100vh-270px)] min-h-[400px]">
            <div className="flex-1 overflow-auto custom-scroll">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                    <TableHead className="w-[160px]">Usuario</TableHead>
                    <TableHead className="w-[120px]">Rol</TableHead>
                    <TableHead className="w-[140px]">Acción</TableHead>
                    <TableHead className="w-[120px]">Entidad</TableHead>
                    <TableHead>Detalle de la Operación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-48 text-slate-500">
                        No se encontraron registros de auditoría con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-slate-600 font-medium">
                          {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700">{log.userName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-slate-500 border-slate-300">
                            {log.userRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{log.entity}</TableCell>
                        <TableCell className="text-slate-700">{log.details}</TableCell>
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
