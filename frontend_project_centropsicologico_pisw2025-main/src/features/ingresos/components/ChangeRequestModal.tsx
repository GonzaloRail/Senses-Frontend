import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useCreateChangeRequest } from "../hooks/useIngresosMutations";
import { toast } from "sonner";
import { CHANGE_TYPE_LABELS } from "../utils/ingresosUtils";

interface Props {
  incomeId: string | null;
  type: "CANCELLATION" | "CORRECTION" | "REFUND" | null;
  open: boolean;
  onClose: () => void;
}

export const ChangeRequestModal = ({ incomeId, type, open, onClose }: Props) => {
  const [reason, setReason] = useState("");
  const [allocationId, setAllocationId] = useState("");
  const [amount, setAmount] = useState("");

  const mutation = useCreateChangeRequest();

  const handleSubmit = async () => {
    if (!incomeId || !type || !reason.trim()) return;

    const payload: any = { type, reason: reason.trim() };
    if (type === "REFUND") {
      if (!allocationId.trim() || !amount) return;
      payload.allocationId = allocationId.trim();
      payload.requestedAmount = Number(amount);
    }

    try {
      await mutation.mutateAsync({ incomeId, payload });
      toast.success(`Solicitud de ${CHANGE_TYPE_LABELS[type].toLowerCase()} enviada correctamente`);
      onClose();
      setReason("");
      setAllocationId("");
      setAmount("");
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Error al crear la solicitud";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type ? CHANGE_TYPE_LABELS[type] : "Solicitar cambio"}
          </DialogTitle>
          <DialogDescription>
            {type ? `Solicitar ${CHANGE_TYPE_LABELS[type].toLowerCase()} para el comprobante.` : "Complete los datos de la solicitud."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Textarea
              placeholder="Describa el motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {type === "REFUND" && (
            <>
              <div className="space-y-2">
                <Label>ID de la asignación (allocationId) *</Label>
                <Input
                  placeholder="UUID de la asignación a devolver"
                  value={allocationId}
                  onChange={(e) => setAllocationId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Monto a devolver *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !reason.trim() || (type === "REFUND" && (!allocationId.trim() || !amount))}
          >
            {mutation.isPending ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
