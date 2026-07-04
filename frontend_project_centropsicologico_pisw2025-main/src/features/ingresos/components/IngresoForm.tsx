import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SERVICES, ATTENTION_TYPES, PSYCHOLOGISTS, PAYMENT_METHODS, money, calculateIGV } from "../utils/ingresosUtils";
import type { CreateIncomeReceiptInput } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  onSubmit: (data: CreateIncomeReceiptInput) => void;
  onCancel: () => void;
  isPending?: boolean;
}

const initialForm = {
  series: "2026",
  number: 0,
  date: new Date().toISOString().slice(0, 10),
  client: "",
  clientDni: "",
  patient: "",
  patientDoc: "",
  phone: "",
  attention: "Particular",
  service: "Consulta",
  psychologist: PSYCHOLOGISTS[0],
  payment: "Yape",
  total: 0,
};

export const IngresoForm = ({ onSubmit, onCancel, isPending }: Props) => {
  const [form, setForm] = useState(initialForm);

  const update = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const calc = form.total > 0 ? calculateIGV(Number(form.total)) : { subtotal: 0, igv: 0, total: 0 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client.trim()) return;
    if (!form.clientDni.trim()) return;
    if (!form.patient.trim()) return;
    if (!form.patientDoc.trim()) return;
    if (!form.total || form.total <= 0) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del recibo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Serie</Label>
              <Input value={form.series} disabled />
            </div>
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del paciente / cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Cliente</Label>
              <Input placeholder="Nombre del cliente" value={form.client} onChange={(e) => update("client", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>DNI del cliente</Label>
              <Input placeholder="Ingrese el DNI" maxLength={12} value={form.clientDni} onChange={(e) => update("clientDni", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Paciente</Label>
              <Input placeholder="Nombre del paciente" value={form.patient} onChange={(e) => update("patient", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>DNI o HCL del paciente</Label>
              <Input placeholder="Ej: HCL-001 o DNI" value={form.patientDoc} onChange={(e) => update("patientDoc", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Celular</Label>
              <Input placeholder="Ingrese el celular" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Forma de atención</Label>
              <Select value={form.attention} onValueChange={(v) => update("attention", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTENTION_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Servicio</Label>
              <Select value={form.service} onValueChange={(v) => update("service", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Psicólogo(a)</Label>
              <Select value={form.psychologist} onValueChange={(v) => update("psychologist", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PSYCHOLOGISTS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Forma de pago</Label>
              <Select value={form.payment} onValueChange={(v) => update("payment", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Importe total</Label>
              <Input type="number" min="0" step="0.01" placeholder="S/ 0.00" value={form.total || ""} onChange={(e) => update("total", Number(e.target.value))} required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cálculo automático</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-xs font-bold text-muted-foreground">Subtotal</p>
              <p className="text-lg font-extrabold">{money(calc.subtotal)}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-xs font-bold text-muted-foreground">IGV 18%</p>
              <p className="text-lg font-extrabold">{money(calc.igv)}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-xs font-bold text-muted-foreground">Importe total</p>
              <p className="text-lg font-extrabold">{money(calc.total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar pago"}
        </Button>
      </div>
    </form>
  );
};
