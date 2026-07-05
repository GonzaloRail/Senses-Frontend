import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReviewChangeRequest } from "../hooks/useIngresosMutations";
import { toast } from "sonner";
import { CHANGE_TYPE_LABELS, PAYMENT_METHODS, PAYMENT_METHOD_TO_BACKEND } from "../utils/ingresosUtils";
import type { ChangeRequest } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  request: ChangeRequest | null;
  open: boolean;
  onClose: () => void;
  onReviewed?: () => void;
}

export const ReviewChangeRequestModal = ({ request, open, onClose, onReviewed }: Props) => {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [comment, setComment] = useState("");

  const [replacementTotal, setReplacementTotal] = useState("");
  const [replacementPayment, setReplacementPayment] = useState("");

  const mutation = useReviewChangeRequest();

  if (!request) return null;

  const isCorrection = request.type === "CORRECTION";
  const needsReplacement = decision === "APPROVED" && isCorrection;

  const handleSubmit = () => {
    if (!decision) return;

    const payload: any = { status: decision };
    if (comment.trim()) payload.reviewComment = comment.trim();

    if (needsReplacement) {
      if (!replacementTotal || !replacementPayment) return;
      payload.replacement = {
        totalAmount: Number(replacementTotal),
        paymentMethod: PAYMENT_METHOD_TO_BACKEND[replacementPayment] ?? replacementPayment.toUpperCase(),
        allocations: [
          {
            appointmentId: request.allocationId ?? "00000000-0000-0000-0000-000000000000",
            amount: Number(replacementTotal),
          },
        ],
      };
    }

    mutation.mutate(
      { requestId: request.id, payload },
      {
        onSuccess: () => {
          toast.success(`Solicitud ${decision === "APPROVED" ? "aprobada" : "rechazada"} correctamente`);
          onClose();
          setDecision(null);
          setComment("");
          setReplacementTotal("");
          setReplacementPayment("");
          onReviewed?.();
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || error?.message || "Error al revisar la solicitud";
          toast.error(msg);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Revisar solicitud — {CHANGE_TYPE_LABELS[request.type]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-lg space-y-1 text-sm">
            <p><strong>Comprobante:</strong> {request.receiptCode}</p>
            <p><strong>Solicitante:</strong> {request.requestedBy ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}` : "-"}</p>
            <p><strong>Motivo:</strong> {request.reason}</p>
            {request.requestedAmount && (
              <p><strong>Monto solicitado:</strong> S/ {Number(request.requestedAmount).toFixed(2)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Decisión *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={decision === "APPROVED" ? "default" : "outline"}
                className={decision === "APPROVED" ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={() => setDecision("APPROVED")}
              >
                Aprobar
              </Button>
              <Button
                type="button"
                variant={decision === "REJECTED" ? "destructive" : "outline"}
                onClick={() => setDecision("REJECTED")}
              >
                Rechazar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comentario</Label>
            <Textarea
              placeholder="Comentario opcional..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>

          {needsReplacement && (
            <>
              <div className="border-t pt-4">
                <p className="font-medium text-sm mb-3">Datos del comprobante de reemplazo</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nuevo total</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={replacementTotal}
                      onChange={(e) => setReplacementTotal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Nuevo método de pago</Label>
                    <Select value={replacementPayment} onValueChange={setReplacementPayment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={
              mutation.isPending ||
              !decision ||
              (needsReplacement && (!replacementTotal || !replacementPayment))
            }
          >
            {mutation.isPending ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
