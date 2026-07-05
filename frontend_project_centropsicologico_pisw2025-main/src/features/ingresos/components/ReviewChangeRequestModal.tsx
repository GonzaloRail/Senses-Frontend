import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useReviewChangeRequest } from "../hooks/useIngresosMutations";
import { toast } from "sonner";
import {
  CHANGE_TYPE_LABELS,
  CHANGE_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_TO_BACKEND,
  BACKEND_TO_PAYMENT_METHOD,
  money,
  dateDisplay,
  round2,
} from "../utils/ingresosUtils";
import { ingresosApi } from "../api/ingresosApi";
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

  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [newAmounts, setNewAmounts] = useState<Record<string, number>>({});

  const initializedRef = useRef(false);

  const mutation = useReviewChangeRequest();
  const isCorrection = request?.type === "CORRECTION";
  const isRefund = request?.type === "REFUND";

  const { data: incomeData, isLoading: loadingIncome } = useQuery({
    queryKey: ["income-raw", request?.incomeId],
    queryFn: () => ingresosApi.getIncomeRaw(request!.incomeId),
    enabled: isCorrection && open && !!request?.incomeId,
  });

  useEffect(() => {
    if (!open) {
      setDecision(null);
      setComment("");
      setClientName("");
      setClientDocument("");
      setClientPhone("");
      setPaymentMethod("");
      setNewAmounts({});
      initializedRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (incomeData && open && !initializedRef.current) {
      initializedRef.current = true;
      setClientName(incomeData.clientName ?? "");
      setClientDocument(incomeData.clientDocument ?? "");
      setClientPhone(incomeData.clientPhone ?? "");
      setPaymentMethod(BACKEND_TO_PAYMENT_METHOD[incomeData.paymentMethod] ?? incomeData.paymentMethod ?? "");
      const amounts: Record<string, number> = {};
      (incomeData.allocations ?? []).forEach((a: any, i: number) => {
        amounts[i] = Number(a.amount);
      });
      setNewAmounts(amounts);
    }
  }, [incomeData, open]);

  if (!request) return null;

  const allocations = incomeData?.allocations ?? [];
  const total = Object.values(newAmounts).reduce((s, v) => s + (v || 0), 0);

  const handleAmountChange = (index: number, value: string) => {
    const parsed = parseFloat(value);
    setNewAmounts((prev) => ({ ...prev, [index]: isNaN(parsed) ? 0 : parsed }));
  };

  const handleSubmit = async () => {
    if (!decision) return;

    const payload: any = { status: decision };
    if (comment.trim()) payload.reviewComment = comment.trim();

    if (decision === "APPROVED" && isCorrection) {
      if (allocations.length === 0) {
        toast.error("No se pudieron cargar las asignaciones del ingreso original");
        return;
      }

      const replacementAllocations = allocations.map((a: any, i: number) => ({
        appointmentId: a.appointmentId,
        amount: newAmounts[i] ?? Number(a.amount),
      }));

      payload.replacement = {
        totalAmount: round2(total),
        paymentMethod: PAYMENT_METHOD_TO_BACKEND[paymentMethod] ?? paymentMethod.toUpperCase(),
        clientName: clientName.trim(),
        clientDocument: clientDocument.trim(),
        clientPhone: clientPhone.trim(),
        allocations: replacementAllocations,
      };
    }

    try {
      await mutation.mutateAsync({ requestId: request.id, payload });
      toast.success(`Solicitud ${decision === "APPROVED" ? "aprobada" : "rechazada"} correctamente`);
      onClose();
      onReviewed?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Error al revisar la solicitud";
      toast.error(msg);
    }
  };

  const needsReplacementData = decision === "APPROVED" && isCorrection;
  const canSubmit = decision &&
    (!needsReplacementData || (
      clientName.trim() &&
      clientDocument.trim() &&
      clientPhone.trim() &&
      paymentMethod &&
      Object.keys(newAmounts).length > 0 &&
      total > 0
    ));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={isCorrection ? "max-w-3xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle>
            Revisar solicitud — {CHANGE_TYPE_LABELS[request.type]}
          </DialogTitle>
          <DialogDescription>
            Revise los detalles de la solicitud y apruebe o rechace el cambio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="bg-muted/30 p-3 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span><strong>Comprobante:</strong> {request.receiptCode}</span>
              <Badge variant="outline">{CHANGE_STATUS_LABELS[request.status]}</Badge>
            </div>
            <p><strong>Solicitante:</strong> {request.requestedBy ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}` : "-"}</p>
            <p><strong>Fecha:</strong> {dateDisplay(request.createdAt)}</p>
            <p><strong>Motivo:</strong> {request.reason}</p>
            {request.requestedAmount && (
              <p><strong>Monto solicitado:</strong> {money(request.requestedAmount)}</p>
            )}
          </div>

          {isCorrection && (
            <>
              {loadingIncome ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-senses-primary" />
                </div>
              ) : incomeData ? (
                <>
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Comprobante reemplazante</h4>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Cliente</Label>
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
                    </div>

                    <div>
                      <Label className="mb-2 block">Asignaciones</Label>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Servicio</TableHead>
                              <TableHead>Psicólogo</TableHead>
                              <TableHead className="text-right">Original</TableHead>
                              <TableHead className="text-right">Nuevo monto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allocations.map((a: any, i: number) => (
                              <TableRow key={a.id ?? i}>
                                <TableCell>{dateDisplay(a.appointment?.startDate)}</TableCell>
                                <TableCell>{a.serviceNameSnapshot}</TableCell>
                                <TableCell>{a.psychologistNameSnapshot}</TableCell>
                                <TableCell className="text-right">{money(a.amount)}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-28 h-8 text-right ml-auto"
                                    value={newAmounts[i] ?? ""}
                                    onChange={(e) => handleAmountChange(i, e.target.value)}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Método de pago</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                      <div className="space-y-1 flex flex-col justify-end">
                        <Label className="text-base">Total</Label>
                        <p className="text-2xl font-bold text-right">{money(total)}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-destructive">No se pudo cargar la información del ingreso original.</p>
              )}
            </>
          )}

          {isRefund && incomeData && (
            <div className="border rounded-lg p-3 space-y-1 text-sm bg-muted/20">
              <p className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">Detalle del ingreso</p>
              <p><strong>Cliente:</strong> {incomeData.clientName}</p>
              <p><strong>Total:</strong> {money(incomeData.totalAmount)}</p>
              <p><strong>Método de pago:</strong> {BACKEND_TO_PAYMENT_METHOD[incomeData.paymentMethod] ?? incomeData.paymentMethod}</p>
            </div>
          )}

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !canSubmit}
          >
            {mutation.isPending ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
