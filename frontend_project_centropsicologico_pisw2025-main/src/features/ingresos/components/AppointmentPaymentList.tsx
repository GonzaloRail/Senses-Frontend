import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useConfigureBilling } from "../hooks/useIngresosMutations";
import { money } from "../utils/ingresosUtils";
import { toast } from "sonner";
import type { AccountingService } from "@/shared/interfaces/models/IncomeReceipt";

export interface AppointmentItem {
  id: string;
  startDate: string;
  psychologistName: string;
  paymentStatus: string | null;
  status: string;
  type: string;
  serviceId?: string;
  serviceName?: string;
  agreedAmount?: number;
}

interface Props {
  appointments: AppointmentItem[];
  services: AccountingService[];
  selectedIds: string[];
  amounts: Record<string, number>;
  onToggleSelect: (id: string) => void;
  onAmountChange: (id: string, amount: number) => void;
  loading?: boolean;
}

const paymentStatusBadge = (status: string | null) => {
  const colors: Record<string, string> = {
    PAID: "bg-green-100 text-green-800",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
    UNPAID: "bg-gray-100 text-gray-800",
    REFUND_PENDING: "bg-orange-100 text-orange-800",
    REFUNDED: "bg-red-100 text-red-800",
  };
  if (!status) return null;
  return (
    <Badge className={colors[status] || "bg-gray-100"} variant="outline">
      {status.replace(/_/g, " ")}
    </Badge>
  );
};

export const AppointmentPaymentList = ({
  appointments,
  services,
  selectedIds,
  amounts,
  onToggleSelect,
  onAmountChange,
  loading,
}: Props) => {
  const [configs, setConfigs] = useState<Record<string, { serviceId: string; agreedAmount: string }>>({});
  const [configured, setConfigured] = useState<Set<string>>(new Set());
  const [quickServiceId, setQuickServiceId] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const billingMutation = useConfigureBilling();

  const active = appointments.filter((a) => a.status !== "CANCELED");
  const unpaid = active.filter(
    (a) => a.paymentStatus === "UNPAID" || a.paymentStatus === null
  );
  const needsBilling = unpaid.filter((a) => !configured.has(a.id));
  const readyToPay = unpaid.filter((a) => configured.has(a.id));
  const alreadyPaid = active.filter((a) => a.paymentStatus !== "UNPAID" && a.paymentStatus !== null);
  const canceled = appointments.filter((a) => a.status === "CANCELED");

  const allReadySelected = readyToPay.length > 0 && readyToPay.every((a) => selectedIds.includes(a.id));

  const handleToggleSelectAll = () => {
    if (allReadySelected) {
      readyToPay.forEach((a) => {
        if (selectedIds.includes(a.id)) onToggleSelect(a.id);
      });
    } else {
      readyToPay.forEach((a) => {
        if (!selectedIds.includes(a.id)) {
          const config = configs[a.id];
          const defaultAmount = config ? Number(config.agreedAmount) : (a.agreedAmount ?? 0);
          onAmountChange(a.id, defaultAmount);
          onToggleSelect(a.id);
        }
      });
    }
  };

  const totalSelected = selectedIds.reduce((sum, id) => sum + (Number(amounts[id]) || 0), 0);

  const updateConfig = (appointmentId: string, field: "serviceId" | "agreedAmount", value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [appointmentId]: { ...prev[appointmentId], [field]: value },
    }));
  };

  const handleApplyToAll = () => {
    if (!quickServiceId || !quickPrice) return;
    const newConfigs = { ...configs };
    needsBilling.forEach((app) => {
      newConfigs[app.id] = { serviceId: quickServiceId, agreedAmount: quickPrice };
    });
    setConfigs(newConfigs);
    toast.success(`Configuración aplicada a ${needsBilling.length} cita(s)`);
  };

  const handleConfigure = async (appointmentId: string) => {
    const config = configs[appointmentId];
    if (!config?.serviceId || !config?.agreedAmount) return;

    billingMutation.mutate(
      {
        appointmentId,
        payload: {
          serviceId: config.serviceId,
          agreedAmount: Number(config.agreedAmount),
        },
      },
      {
        onSuccess: () => {
          toast.success("Facturación configurada");
          setConfigured((prev) => new Set(prev).add(appointmentId));
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || error?.message || "Error al configurar facturación";
          toast.error(msg);
        },
      }
    );
  };

  const handleConfigureAll = () => {
    needsBilling.forEach((app) => {
      const config = configs[app.id];
      if (config?.serviceId && config?.agreedAmount && !configured.has(app.id)) {
        handleConfigure(app.id);
      }
    });
  };

  const canConfigureAll = needsBilling.every(
    (app) => configs[app.id]?.serviceId && configs[app.id]?.agreedAmount
  );

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-6 text-sm">
        Cargando citas del paciente...
      </div>
    );
  }

  if (!active.length && !canceled.length) {
    return (
      <div className="text-center text-muted-foreground py-6 text-sm">
        No se encontraron citas para este paciente.
      </div>
    );
  }

  if (canceled.length > 0 && !active.length) {
    return (
      <div className="text-center text-muted-foreground py-6 text-sm">
        Todas las citas están canceladas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needsBilling.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-amber-800">
              {needsBilling.length} cita(s) sin facturación
            </h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleConfigureAll}
              disabled={billingMutation.isPending || !canConfigureAll}
              className="h-7 text-xs"
            >
              {billingMutation.isPending ? "Configurando..." : "Configurar todas"}
            </Button>
          </div>

          {needsBilling.length > 3 && (
            <div className="mb-3 p-3 rounded-lg bg-white border border-amber-300">
              <p className="text-xs font-semibold text-amber-700 mb-2">
                ⚡ Configuración rápida — aplicar a todas
              </p>
              <div className="flex gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Servicio</Label>
                  <Select value={quickServiceId} onValueChange={setQuickServiceId}>
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Precio</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-24 h-8 text-xs"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleApplyToAll}
                  disabled={!quickServiceId || !quickPrice}
                >
                  Aplicar a todas
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {needsBilling.map((app) => (
              <div
                key={app.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(app.startDate).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{app.psychologistName}</p>
                </div>
                <div className="flex gap-2 items-end shrink-0">
                  <div className="space-y-1">
                    <Label className="text-xs">Servicio</Label>
                    <Select
                      value={configs[app.id]?.serviceId ?? ""}
                      onValueChange={(v) => updateConfig(app.id, "serviceId", v)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Precio</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-24 h-8 text-xs"
                      value={configs[app.id]?.agreedAmount ?? ""}
                      onChange={(e) => updateConfig(app.id, "agreedAmount", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleConfigure(app.id)}
                    disabled={billingMutation.isPending || !configs[app.id]?.serviceId || !configs[app.id]?.agreedAmount}
                  >
                    OK
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {readyToPay.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">
              Citas listas para pagar ({readyToPay.length})
            </h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleToggleSelectAll}
            >
              {allReadySelected ? "Deseleccionar todas" : "Seleccionar todas"}
            </Button>
          </div>
          <div className="space-y-2">
            {readyToPay.map((app) => {
              const isSelected = selectedIds.includes(app.id);
              const config = configs[app.id];
              const defaultAmount = config ? Number(config.agreedAmount) : (app.agreedAmount ?? 0);

              return (
                <div
                  key={app.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                      if (!isSelected) {
                        onAmountChange(app.id, defaultAmount);
                      }
                      onToggleSelect(app.id);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {new Date(app.startDate).toLocaleDateString("es-PE", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {paymentStatusBadge(app.paymentStatus)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.psychologistName}
                      {configs[app.id]?.serviceId && services.find(s => s.id === configs[app.id]!.serviceId) && (
                        <> · {services.find(s => s.id === configs[app.id]!.serviceId)!.name}</>
                      )}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-28">
                      <Label className="text-xs">Monto</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="h-8 text-sm"
                        value={amounts[app.id] || ""}
                        onChange={(e) => onAmountChange(app.id, Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {alreadyPaid.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Citas ya pagadas ({alreadyPaid.length})
          </h4>
          <div className="space-y-1">
            {alreadyPaid.map((app) => (
              <div key={app.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {new Date(app.startDate).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{app.psychologistName}</p>
                </div>
                {paymentStatusBadge(app.paymentStatus)}
              </div>
            ))}
          </div>
        </div>
      )}

      {canceled.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Citas canceladas ({canceled.length})
          </h4>
          <div className="space-y-1">
            {canceled.map((app) => (
              <div key={app.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 border border-red-100">
                <div className="flex-1">
                  <p className="text-sm text-red-600 line-through">
                    {new Date(app.startDate).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-red-400">{app.psychologistName}</p>
                </div>
                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Cancelada</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex justify-end border-t pt-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} cita(s) seleccionada(s)
            </p>
            <p className="text-lg font-extrabold">{money(totalSelected)}</p>
          </div>
        </div>
      )}
    </div>
  );
};
