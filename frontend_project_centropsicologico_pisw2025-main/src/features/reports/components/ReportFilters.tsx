import { useState, useRef, useEffect } from "react";
import type { ReportType } from "@/shared/interfaces/models/Financial";
import { PAYMENT_METHODS } from "@/features/financial-dashboard/utils/mockData";

interface PsychologistOption {
  id: string;
  name: string;
}

interface PatientOption {
  id: string;
  name: string;
  dni?: string;
}

interface Props {
  dateFrom: string;
  dateTo: string;
  patient: string;
  psychologist: string;
  paymentMethod: string;
  reportType: ReportType;
  psychologistOptions: PsychologistOption[];
  psychologistLoading: boolean;
  patientOptions: PatientOption[];
  patientSearchLoading: boolean;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onPatientChange: (v: string) => void;
  onPatientSearch: (query: string) => void;
  onPsychologistChange: (v: string) => void;
  onPaymentMethodChange: (v: string) => void;
  onReportTypeChange: (v: ReportType) => void;
  onClear: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

const REPORT_TYPES: { label: string; value: ReportType }[] = [
  { label: "Ingresos", value: "income" },
  { label: "Egresos", value: "expenses" },
  { label: "Recibos emitidos / anulados", value: "receipts" },
  { label: "Comisiones por psicólogo", value: "commissions" },
  { label: "Flujo de fondos", value: "cash-flow" },
];

export const ReportFilters = ({
  dateFrom, dateTo, patient, psychologist, paymentMethod, reportType,
  psychologistOptions, psychologistLoading, patientOptions, patientSearchLoading,
  onDateFromChange, onDateToChange, onPatientChange, onPatientSearch,
  onPsychologistChange, onPaymentMethodChange, onReportTypeChange,
  onClear, onExportPdf, onExportExcel,
}: Props) => {
  const [patientInput, setPatientInput] = useState(patient || "");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (patientRef.current && !patientRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePatientInput = (val: string) => {
    setPatientInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onPatientSearch(val);
      if (val.trim().length > 0) setShowPatientDropdown(true);
      else setShowPatientDropdown(false);
    }, 350);
  };

  const selectPatient = (opt: PatientOption) => {
    setPatientInput(opt.name);
    onPatientChange(opt.id);
    setShowPatientDropdown(false);
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-senses-primary">Filtros del reporte</h3>
        <div className="flex gap-2">
          <button onClick={onExportPdf} className="border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted">
            PDF
          </button>
          <button onClick={onExportExcel} className="border rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted">
            Excel
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Tipo reporte</label>
          <select
            value={reportType}
            onChange={(e) => onReportTypeChange(e.target.value as ReportType)}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white"
          >
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Desde</label>
          <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm bg-white" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Hasta</label>
          <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm bg-white" />
        </div>
        <div className="flex flex-col gap-1 relative" ref={patientRef}>
          <label className="text-xs font-bold text-muted-foreground uppercase">Paciente</label>
          <input
            placeholder="Buscar por nombre o DNI..."
            value={patientInput}
            onChange={(e) => handlePatientInput(e.target.value)}
            onFocus={() => { if (patientOptions.length > 0) setShowPatientDropdown(true); }}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white"
          />
          {showPatientDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-auto rounded-md border bg-white shadow-lg">
              {patientSearchLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
              ) : patientOptions.length > 0 ? (
                patientOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                    onClick={() => selectPatient(opt)}
                  >
                    {opt.name} {opt.dni ? `- DNI: ${opt.dni}` : ""}
                  </div>
                ))
              ) : patientInput.trim().length > 0 ? (
                <div className="p-2 text-sm text-muted-foreground">Sin resultados</div>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Psicólogo</label>
          <select value={psychologist} onChange={(e) => onPsychologistChange(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm bg-white">
            <option value="">Todos</option>
            {psychologistLoading ? (
              <option value="" disabled>Cargando...</option>
            ) : (
              psychologistOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Forma de pago</label>
          <select value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm bg-white">
            <option value="">Todas</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={onClear} className="bg-senses-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium w-full hover:bg-senses-primary/90">
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
};
