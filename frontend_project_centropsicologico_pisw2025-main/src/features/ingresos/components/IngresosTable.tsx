import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dateDisplay, money, pad } from "../utils/ingresosUtils";
import { ChangeRequestModal } from "./ChangeRequestModal";
import type { IncomeReceipt } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  receipts: IncomeReceipt[];
  onView: (id: string) => void;
  onShowReceipt: (receipt: IncomeReceipt | null) => void;
}

const statusBadge = (status: IncomeReceipt["status"]) => {
  const colors: Record<string, string> = {
    Vigente: "bg-green-100 text-green-800 hover:bg-green-100",
    Anulado: "bg-red-100 text-red-800 hover:bg-red-100",
    Corregido: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  };
  return <Badge className={colors[status] || ""} variant="outline">{status}</Badge>;
};

export const IngresosTable = ({ receipts, onView, onShowReceipt }: Props) => {
  const [changeRequestTarget, setChangeRequestTarget] = useState<{ id: string; type: "CANCELLATION" | "CORRECTION" | "REFUND" } | null>(null);

  if (!receipts.length) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No se encontraron ingresos.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Serie</TableHead>
              <TableHead>N°</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>DNI/HCL</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Psicólogo</TableHead>
              <TableHead>Atención</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">IGV</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/50">
                <TableCell>{dateDisplay(r.date)}</TableCell>
                <TableCell>{r.series}</TableCell>
                <TableCell>{pad(r.number)}</TableCell>
                <TableCell>{r.client}</TableCell>
                <TableCell>{r.clientDni}</TableCell>
                <TableCell>{r.patient}</TableCell>
                <TableCell>{r.patientDoc}</TableCell>
                <TableCell>{r.service}</TableCell>
                <TableCell>{r.psychologist}</TableCell>
                <TableCell>{r.attention}</TableCell>
                <TableCell>{r.payment}</TableCell>
                <TableCell className="text-right">{money(r.subtotal)}</TableCell>
                <TableCell className="text-right">{money(r.igv)}</TableCell>
                <TableCell className="text-right font-bold">{money(r.total)}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="text-xs">{r.createdBy}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => onView(r.id)}>Ver</Button>
                    <Button variant="outline" size="sm" onClick={() => onShowReceipt(r)}>
                      Boleta
                    </Button>
                    {r.status === "Vigente" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="destructive" size="sm">Acciones</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setChangeRequestTarget({ id: r.id, type: "CANCELLATION" })}>
                            Anular
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setChangeRequestTarget({ id: r.id, type: "CORRECTION" })}>
                            Corregir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setChangeRequestTarget({ id: r.id, type: "REFUND" })}>
                            Devolver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ChangeRequestModal
        incomeId={changeRequestTarget?.id ?? null}
        type={changeRequestTarget?.type ?? null}
        open={!!changeRequestTarget}
        onClose={() => setChangeRequestTarget(null)}
      />
    </>
  );
};
