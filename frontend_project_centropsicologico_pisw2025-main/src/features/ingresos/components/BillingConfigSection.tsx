import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useConfigureBilling } from "../hooks/useIngresosMutations";
import { toast } from "sonner";
import type { AccountingService } from "@/shared/interfaces/models/IncomeReceipt";

interface AppointmentBilling {
  appointmentId: string;
  date: string;
  psychologistName: string;
  status: string;
  paymentStatus: string | null;
}

interface Props {
  appointments: AppointmentBilling[];
  services: AccountingService[];
  onBillingConfigured: (appointmentId: string) => void;
}

export const BillingConfigSection = ({ appointments, services, onBillingConfigured }: Props) => {
  const [configs, setConfigs] = useState<Record<string, { serviceId: string; agreedAmount: string }>>({});
  const [configured, setConfigured] = useState<Set<string>>(new Set());
  const mutation = useConfigureBilling();

  const needsConfig = appointments.filter(
    (a) => a.paymentStatus === "UNPAID" || a.paymentStatus === null
  );

  if (needsConfig.length === 0) return null;

  const updateConfig = (appointmentId: string, field: "serviceId" | "agreedAmount", value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [appointmentId]: { ...prev[appointmentId], [field]: value },
    }));
  };

  const handleConfigure = async (appointmentId: string) => {
    const config = configs[appointmentId];
    if (!config?.serviceId || !config?.agreedAmount) return;

    mutation.mutate(
      {
        appointmentId,
        payload: {
          serviceId: config.serviceId,
          agreedAmount: Number(config.agreedAmount),
        },
      },
      {
        onSuccess: () => {
          toast.success("Facturación configurada correctamente");
          setConfigured((prev) => new Set(prev).add(appointmentId));
          onBillingConfigured(appointmentId);
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || error?.message || "Error al configurar facturación";
          toast.error(msg);
        },
      }
    );
  };

  const handleConfigureAll = () => {
    needsConfig.forEach((app) => {
      const config = configs[app.appointmentId];
      if (config?.serviceId && config?.agreedAmount && !configured.has(app.appointmentId)) {
        handleConfigure(app.appointmentId);
      }
    });
  };

  const allConfigured = needsConfig.every((app) => configured.has(app.appointmentId));
  const canConfigureAll = needsConfig.every(
    (app) => configs[app.appointmentId]?.serviceId && configs[app.appointmentId]?.agreedAmount
  );

  if (allConfigured) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Configurar facturación de citas</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={handleConfigureAll}
            disabled={mutation.isPending || !canConfigureAll}
          >
            {mutation.isPending ? "Configurando..." : "Configurar todas"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsConfig.map((app) => (
          <div
            key={app.appointmentId}
            className={`p-4 rounded-lg border transition-colors ${
              configured.has(app.appointmentId) ? "border-green-300 bg-green-50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {new Date(app.date).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{app.psychologistName}</p>
              </div>
              {configured.has(app.appointmentId) ? (
                <p className="text-sm text-green-600 font-medium">Configurado</p>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Servicio</Label>
                    <Select
                      value={configs[app.appointmentId]?.serviceId ?? ""}
                      onValueChange={(v) => updateConfig(app.appointmentId, "serviceId", v)}
                    >
                      <SelectTrigger className="w-44">
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
                      className="w-28"
                      value={configs[app.appointmentId]?.agreedAmount ?? ""}
                      onChange={(e) => updateConfig(app.appointmentId, "agreedAmount", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleConfigure(app.appointmentId)}
                    disabled={mutation.isPending || !configs[app.appointmentId]?.serviceId || !configs[app.appointmentId]?.agreedAmount}
                  >
                    OK
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
