import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money, dateDisplay, pad } from "../utils/ingresosUtils";
import type { IncomeReceipt } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  receipt: IncomeReceipt | null;
  open: boolean;
  onClose: () => void;
}

const statusBadge = (status: IncomeReceipt["status"]) => {
  const colors: Record<string, string> = {
    Vigente: "bg-green-100 text-green-800",
    Anulado: "bg-red-100 text-red-800",
    Corregido: "bg-blue-100 text-blue-800",
  };
  return <Badge className={colors[status] || ""} variant="outline">{status}</Badge>;
};

export const IngresoDetailModal = ({ receipt, open, onClose }: Props) => {
  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Recibo {receipt.series}-{pad(receipt.number)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold text-muted-foreground text-xs">Cliente</p>
            <p>{receipt.client}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">DNI</p>
            <p>{receipt.clientDni}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Paciente</p>
            <p>{receipt.patient}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">DNI/HCL</p>
            <p>{receipt.patientDoc}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Celular</p>
            <p>{receipt.phone || "-"}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Atención</p>
            <p>{receipt.attention}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Servicio</p>
            <p>{receipt.service}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Psicólogo</p>
            <p>{receipt.psychologist}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Forma de pago</p>
            <p>{receipt.payment}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Estado</p>
            <p>{statusBadge(receipt.status)}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Fecha</p>
            <p>{dateDisplay(receipt.date)}</p>
          </div>
          <div>
            <p className="font-bold text-muted-foreground text-xs">Registrado por</p>
            <p>{receipt.createdBy}</p>
          </div>
        </div>

        <hr />

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs font-bold text-muted-foreground">Subtotal</p>
            <p className="text-lg font-extrabold">{money(receipt.subtotal)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs font-bold text-muted-foreground">IGV 18%</p>
            <p className="text-lg font-extrabold">{money(receipt.igv)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs font-bold text-muted-foreground">Total</p>
            <p className="text-lg font-extrabold">{money(receipt.total)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
