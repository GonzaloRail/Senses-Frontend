import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PatientSearchSelect } from "@/features/appointments/components/PatientSearchSelect";
import { usePatientSearchQuery } from "@/features/patients/hooks";
import { getAppointmentsByPatientApi } from "@/features/appointments/api/appointmentsApi";
import { getPatientByIdApi } from "@/features/patients/api/patientsApi";
import { useAccountingServices } from "../hooks/useIngresosQueries";
import { AppointmentPaymentList } from "./AppointmentPaymentList";
import type { AppointmentItem } from "./AppointmentPaymentList";
import { money, PAYMENT_METHODS, calculateIGV, ATTENTION_TYPES } from "../utils/ingresosUtils";
import type { CreateIncomePayload } from "@/shared/interfaces/models/IncomeReceipt";

type PayerType = "patient" | "parent" | "other";

interface Props {
  onSubmit: (data: CreateIncomePayload) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const IngresoForm = ({ onSubmit, onCancel, isPending }: Props) => {
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; firstName: string; lastName: string; dni: string } | null>(null);
  const [fullPatient, setFullPatient] = useState<any>(null);
  const [payerType, setPayerType] = useState<PayerType>("patient");
  const [clientName, setClientName] = useState("");
  const [clientDni, setClientDni] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientDoc, setPatientDoc] = useState("");
  const [attentionType, setAttentionType] = useState("Particular");
  const [phone, setPhone] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Yape");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [psychologistName, setPsychologistName] = useState("");
  const payerInitialized = useRef(false);

  const { patients, isLoading: searchingPatient, setSearchFilters } = usePatientSearchQuery();
  const { data: services = [] } = useAccountingServices();

  const patientOptions = patients.map((p: any) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    dni: p.dni,
  }));

  const totalAmount = selectedIds.reduce((sum, id) => sum + (Number(amounts[id]) || 0), 0);
  const { subtotal, igv } = calculateIGV(totalAmount);

  const applyPayerData = useCallback((type: PayerType, patient: any) => {
    if (type === "patient") {
      setClientName(`${patient.firstName} ${patient.lastName}`);
      setClientDni(patient.dni);
      setPhone(patient.phoneNumber ?? "");
    } else if (type === "parent" && patient?.parentFullName) {
      setClientName(patient.parentFullName);
      setClientDni(patient.parentDni ?? "");
      setPhone(patient.parentPhoneNumber ?? "");
    }
  }, []);

  const handlePatientSelect = useCallback(async (patientId: string) => {
    const found = patients.find((p: any) => p.id === patientId);
    if (!found) return;
    const p = found as any;

    setSelectedPatient({ id: p.id, firstName: p.firstName, lastName: p.lastName, dni: p.dni });
    setPatientName(`${p.firstName} ${p.lastName}`);
    setPatientDoc(p.dni);
    setSelectedIds([]);
    setAmounts({});
    setPsychologistName("");
    setServiceDescription("");
    setAttentionType("Particular");
    payerInitialized.current = false;

    let full: any = null;
    try {
      full = await getPatientByIdApi({ id: p.id });
      setFullPatient(full);
      if (full?.phoneNumber) setPhone(full.phoneNumber);
      if (full?.clinicalHistory?.displayInt) {
        setPatientDoc(`HCL-${full.clinicalHistory.displayInt}`);
      }
    } catch {
    }

    const hasParent = full?.parentFullName?.trim();
    const defaultPayer: PayerType = hasParent ? "parent" : "patient";
    setPayerType(defaultPayer);
    payerInitialized.current = true;
    applyPayerData(defaultPayer, full ?? p);

    setLoadingApps(true);
    try {
      const apps = await getAppointmentsByPatientApi(patientId);
      const mapped: AppointmentItem[] = (apps ?? []).map((a: any) => ({
        id: a.resource.id,
        startDate: a.startDate,
        psychologistName: a.resource.psychologistName,
        paymentStatus: a.resource.paymentStatus,
        status: a.resource.status,
        type: a.resource.type,
      }));
      setAppointments(mapped);
      if (mapped.length > 0) {
        setPsychologistName(mapped[0].psychologistName);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoadingApps(false);
    }
  }, [patients, applyPayerData]);

  const handlePayerTypeChange = useCallback((type: PayerType) => {
    setPayerType(type);
    if (type === "other") return;
    applyPayerData(type, fullPatient ?? selectedPatient);
  }, [fullPatient, selectedPatient, applyPayerData]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleAmountChange = useCallback((id: string, amount: number) => {
    setAmounts((prev) => ({ ...prev, [id]: amount }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !clientName.trim() || !clientDni.trim()) return;
    if (totalAmount <= 0 || !selectedIds.length) return;

    const allocations = selectedIds
      .filter((id) => (Number(amounts[id]) || 0) > 0)
      .map((id) => ({
        appointmentId: id,
        amount: Number(amounts[id]),
      }));

    if (!allocations.length) return;

    onSubmit({
      patientId: selectedPatient.id,
      totalAmount,
      payment: paymentMethod,
      paidAt: new Date().toISOString(),
      clientName: clientName.trim(),
      clientDocument: clientDni.trim(),
      clientPhone: phone.trim(),
      allocations,
      attentionType,
      serviceDescription: serviceDescription.trim(),
      psychologistName,
    });
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setFullPatient(null);
    setClientName(""); setClientDni(""); setPatientName(""); setPatientDoc(""); setPhone("");
    setServiceDescription(""); setPsychologistName("");
    setSelectedIds([]); setAmounts({}); setAppointments([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Nuevo recibo</CardTitle>
          {selectedPatient && (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cambiar paciente
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <PatientSearchSelect
            label="Buscar paciente"
            value={selectedPatient?.id ?? ""}
            onValueChange={handlePatientSelect}
            onSearch={(filters) => setSearchFilters(filters)}
            options={patientOptions}
            loading={searchingPatient}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Serie de recibo</Label>
              <Input value="B001" disabled className="bg-muted h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Número de recibo</Label>
              <Input value="Generado al crear" disabled className="bg-muted h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha de registro</Label>
              <Input value={new Date().toISOString().slice(0, 10)} disabled className="bg-muted h-8 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Cliente</Label>
              <Input
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); if (payerType === "patient" || payerType === "parent") setPayerType("other"); }}
                placeholder="Nombre de quien paga"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">DNI del cliente</Label>
              <Input
                value={clientDni}
                onChange={(e) => { setClientDni(e.target.value); if (payerType === "patient" || payerType === "parent") setPayerType("other"); }}
                maxLength={12}
                placeholder="DNI del cliente"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pagador</Label>
              <div className="flex gap-1 h-8">
                {["patient", "parent", "other"].map((t) => {
                  const labels: Record<PayerType, string> = { patient: "Paciente", parent: "Apoderado", other: "Otro" };
                  return (
                    <Button
                      key={t}
                      type="button"
                      variant={payerType === t ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs px-3 ${payerType === t ? "" : "text-muted-foreground"}`}
                      onClick={() => handlePayerTypeChange(t as PayerType)}
                      disabled={t === "parent" && !fullPatient?.parentFullName}
                    >
                      {labels[t as PayerType]}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Forma de atención</Label>
              <Select value={attentionType} onValueChange={setAttentionType}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTENTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Celular</Label>
              <Input
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (payerType === "patient" || payerType === "parent") setPayerType("other"); }}
                placeholder="Número de celular"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Paciente</Label>
              <Input value={patientName} disabled className="bg-muted h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">DNI - HCL del paciente</Label>
              <Input value={patientDoc} disabled className="bg-muted h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descripción del servicio</Label>
              <Input
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Escriba el servicio"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Psicólogo</Label>
              <Input value={psychologistName} disabled className="bg-muted h-8 text-xs" placeholder="Desde las citas" />
            </div>
          </div>

          {selectedPatient && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Citas del paciente</h3>
              <AppointmentPaymentList
                appointments={appointments}
                services={services}
                selectedIds={selectedIds}
                amounts={amounts}
                onToggleSelect={handleToggleSelect}
                onAmountChange={handleAmountChange}
                loading={loadingApps}
              />
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Forma de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-bold text-muted-foreground">Subtotal</p>
              <p className="text-lg font-extrabold mt-1">{money(subtotal)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-bold text-muted-foreground">IGV 18%</p>
              <p className="text-lg font-extrabold mt-1">{money(igv)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-bold text-muted-foreground">Importe total</p>
              <p className="text-lg font-extrabold mt-1">{money(totalAmount)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-bold text-muted-foreground">Tipo</p>
              <p className="text-lg font-extrabold mt-1">Interno</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          type="submit"
          disabled={isPending || totalAmount <= 0 || selectedIds.length === 0}
        >
          {isPending ? "Registrando..." : "Registrar pago"}
        </Button>
      </div>
    </form>
  );
};
