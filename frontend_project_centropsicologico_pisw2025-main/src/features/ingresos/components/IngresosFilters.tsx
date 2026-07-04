import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PSYCHOLOGISTS, PAYMENT_METHODS, getEmptyFilters } from "../utils/ingresosUtils";
import type { IncomeReceiptFilters } from "@/shared/interfaces/models/IncomeReceipt";

interface Props {
  filters: IncomeReceiptFilters;
  onChange: (filters: IncomeReceiptFilters) => void;
  onSearch: () => void;
}

export const IngresosFilters = ({ filters, onChange, onSearch }: Props) => {
  const update = (key: keyof IncomeReceiptFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clear = () => {
    onChange(getEmptyFilters());
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Desde</Label>
        <Input type="date" value={filters.dateFrom} onChange={(e) => update("dateFrom", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Hasta</Label>
        <Input type="date" value={filters.dateTo} onChange={(e) => update("dateTo", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Paciente</Label>
        <Input placeholder="Buscar paciente" value={filters.patient} onChange={(e) => update("patient", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Cliente</Label>
        <Input placeholder="Buscar cliente" value={filters.client} onChange={(e) => update("client", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Psicólogo</Label>
        <Select value={filters.psychologist} onValueChange={(v) => update("psychologist", v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {PSYCHOLOGISTS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Forma de pago</Label>
        <Select value={filters.payment} onValueChange={(v) => update("payment", v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {PAYMENT_METHODS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">N° recibo</Label>
        <Input placeholder="000001" value={filters.number} onChange={(e) => update("number", e.target.value)} />
      </div>
      <div className="flex items-end gap-2">
        <Button onClick={onSearch}>Buscar</Button>
        <Button variant="outline" onClick={clear}>Limpiar</Button>
      </div>
    </div>
  );
};
