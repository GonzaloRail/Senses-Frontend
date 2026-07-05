import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateChangeRequest } from "../hooks/useIngresosMutations";
import { toast } from "sonner";
import { money } from "../utils/ingresosUtils";
import type { IncomeReceipt } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  receipt: IncomeReceipt | null;
  open: boolean;
  onClose: () => void;
  onEdited?: () => void;
}

export const EditIncomeModal = ({ receipt, open, onClose, onEdited }: Props) => {
  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useCreateChangeRequest();

  useEffect(() => {
    if (receipt && open) {
      setClientName(receipt.client ?? "");
      setClientDocument(receipt.clientDni ?? "");
      setClientPhone(receipt.phone ?? "");
      setReason("Corrección de datos del cliente");
    }
  }, [receipt, open]);

  if (!receipt) return null;

  const originalName = receipt.client ?? "";
  const originalDoc = receipt.clientDni ?? "";
  const originalPhone = receipt.phone ?? "";

  const hasChanges =
    clientName !== originalName ||
    clientDocument !== originalDoc ||
    clientPhone !== originalPhone;

  const buildReason = () => {
    const changes: string[] = [];
    if (clientName !== originalName) changes.push(`nombre: "${originalName}" → "${clientName}"`);
    if (clientDocument !== originalDoc) changes.push(`documento: "${originalDoc}" → "${clientDocument}"`);
    if (clientPhone !== originalPhone) changes.push(`teléfono: "${originalPhone}" → "${clientPhone}"`);
    const base = reason.trim() || "Corrección de datos del cliente";
    return changes.length > 0 ? `${base}\n${changes.join(", ")}` : base;
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("No se realizaron cambios");
      return;
    }

    try {
      await mutation.mutateAsync({
        incomeId: receipt.id,
        payload: {
          type: "CORRECTION",
          reason: buildReason(),
        },
      });
      toast.success("Solicitud de corrección enviada al gerente");
      onClose();
      onEdited?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Error al crear la solicitud";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar datos del cliente</DialogTitle>
          <DialogDescription>
            Modifique los datos del cliente. Se creará una solicitud de corrección para que el gerente la apruebe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-lg space-y-1 text-sm">
            <p><strong>Comprobante:</strong> {receipt.series}-{String(receipt.number).padStart(6, "0")}</p>
            <p><strong>Paciente:</strong> {receipt.patient}</p>
            <p><strong>Total:</strong> {money(receipt.total)}</p>
          </div>

          <div className="space-y-1">
            <Label>Nombre del cliente</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Documento</Label>
            <Input value={clientDocument} onChange={(e) => setClientDocument(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Teléfono</Label>
            <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Motivo de la corrección</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Describa el motivo..."
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Al guardar se creará una solicitud de corrección para que el gerente la revise y apruebe.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={mutation.isPending || !hasChanges}
          >
            {mutation.isPending ? "Enviando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
