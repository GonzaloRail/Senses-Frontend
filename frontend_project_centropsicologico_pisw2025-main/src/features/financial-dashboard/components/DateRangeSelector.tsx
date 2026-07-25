import type { DateMode } from "@/shared/interfaces/models/Financial";
import { PAYMENT_METHODS } from "../utils/mockData";

interface Props {
  dateMode: DateMode;
  selectedDate: Date;
  customFrom: string;
  customTo: string;
  paymentFilter: string;
  onDateModeChange: (mode: DateMode) => void;
  onSelectedDateChange: (date: Date) => void;
  onCustomFromChange: (val: string) => void;
  onCustomToChange: (val: string) => void;
  onPaymentFilterChange: (val: string) => void;
  onClearFilters: () => void;
}

const MODES: { label: string; value: DateMode }[] = [
  { label: "Día", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
  { label: "Personalizado", value: "custom" },
];

export const DateRangeSelector = ({
  dateMode,
  selectedDate,
  customFrom,
  customTo,
  paymentFilter,
  onDateModeChange,
  onSelectedDateChange,
  onCustomFromChange,
  onCustomToChange,
  onPaymentFilterChange,
  onClearFilters,
}: Props) => {
  const monthValue = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap gap-3 items-end mb-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Período</label>
        <div className="flex rounded-lg border overflow-hidden">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onDateModeChange(m.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                dateMode === m.value
                  ? "bg-senses-primary text-white"
                  : "bg-white text-foreground hover:bg-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {dateMode === "month" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Mes</label>
          <input
            type="month"
            value={monthValue}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-").map(Number);
              onSelectedDateChange(new Date(year, month - 1, 1));
            }}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          />
        </div>
      )}

      {dateMode === "day" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Día</label>
          <input
            type="date"
            value={selectedDate.toISOString().slice(0, 10)}
            onChange={(e) => onSelectedDateChange(new Date(e.target.value + "T00:00:00"))}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          />
        </div>
      )}

      {dateMode === "week" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Fin de semana</label>
          <input
            type="date"
            value={selectedDate.toISOString().slice(0, 10)}
            onChange={(e) => onSelectedDateChange(new Date(e.target.value + "T00:00:00"))}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          />
        </div>
      )}

      {dateMode === "custom" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Desde</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Hasta</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm bg-white"
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Forma de pago</label>
        <select
          value={paymentFilter}
          onChange={(e) => onPaymentFilterChange(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white min-w-[140px]"
        >
          <option value="">Todos</option>
          {PAYMENT_METHODS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <button onClick={onClearFilters} className="text-sm px-3 py-1.5 border rounded-lg hover:bg-muted">
        Limpiar filtros
      </button>
    </div>
  );
};
